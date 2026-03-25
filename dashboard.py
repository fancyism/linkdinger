"""
Linkdinger Dashboard — Local admin panel for blog monitoring.

Runs as part of the Linkdinger daemon on http://localhost:9999
Uses Dark Glassmorphism design system.

Phase 3: Activity log, content freshness scoring, git history,
         Upstash usage monitor, system diagnostics.
"""

import glob
import json
import logging
import os
import re
import subprocess
import threading
from collections import Counter, deque
from datetime import datetime, timedelta
from pathlib import Path
from urllib.parse import quote

import boto3  # type: ignore[import-untyped]
import requests  # type: ignore[import-untyped]
import yaml  # type: ignore[import-untyped]
from dotenv import load_dotenv  # type: ignore[import-untyped]
from flask import Flask, Response, jsonify  # type: ignore[import-untyped]
from flask import request as flask_request

load_dotenv()

logger = logging.getLogger(__name__)

app = Flask(__name__)

ANALYTICS_METRICS = (
    "cta_clicks",
    "affiliate_clicks",
    "email_opt_ins",
    "consultation_clicks",
    "consultation_submits",
    "consultation_bookings",
    "estimated_revenue_cents",
    "realized_revenue_cents",
)

# ─── Shared State (set by linkdinger.py) ────────────────────────
from typing import Any, Optional

_daemon_state: dict[str, Any] = {
    "started_at": None,
    "images_processed": 0,
    "posts_synced": 0,
    "last_git_push": None,
    "auto_git_ref": None,
    "sync_config_ref": None,
}

# Activity log — ring buffer of recent events (max 100)
_activity_log = deque(maxlen=100)


def log_activity(event_type: str, message: str, details: str = ""):
    """Add an event to the activity log."""
    _activity_log.appendleft(
        {
            "time": datetime.now().isoformat(),
            "type": event_type,
            "message": message,
            "details": details,
        }
    )


def set_daemon_state(**kwargs):
    """Called by linkdinger.py to share state with dashboard."""
    _daemon_state.update(kwargs)


# ─── Data Collectors ────────────────────────────────────────────


def get_pipeline_status() -> dict[str, Any]:
    started: Optional[datetime] = _daemon_state.get("started_at")
    uptime: Optional[str] = None
    if started and isinstance(started, datetime):
        delta = datetime.now() - started
        hours, remainder = divmod(int(delta.total_seconds()), 3600)
        minutes, seconds = divmod(remainder, 60)
        uptime = f"{hours}h {minutes}m {seconds}s"

    return {
        "daemon_running": started is not None,
        "uptime": uptime or "—",
        "images_processed": _daemon_state.get("images_processed", 0),
        "posts_synced": _daemon_state.get("posts_synced", 0),
        "last_git_push": _daemon_state.get("last_git_push", "—"),
    }


def _parse_post_frontmatter(filepath: str) -> dict[str, Any]:
    """Parse a markdown file's frontmatter and compute metadata."""
    with open(filepath, "r", encoding="utf-8") as f:
        content = f.read()

    fm: dict[str, Any] = {}
    body: str = content
    if content.startswith("---"):
        end = content.find("---", 3)
        if end != -1:
            fm = yaml.safe_load(content[3:end]) or {}  # type: ignore[index]
            body = content[end + 3 :]  # type: ignore[index]

    # Word count
    words = len(body.split())

    # Estimate read time (200 wpm)
    read_min = max(1, round(words / 200))

    # Check for images
    image_urls: list[str] = re.findall(r"!\[.*?\]\((https?://[^)]+)\)", body)
    # Also check coverImage
    cover: str = fm.get("coverImage", "")
    if cover and cover.startswith("http"):
        image_urls.insert(0, cover)

    slug = str(fm.get("slug", os.path.splitext(os.path.basename(filepath))[0])).replace(".md", "")

    return {
        "filename": os.path.basename(filepath),
        "slug": slug,
        "title": fm.get("title", os.path.basename(filepath).replace(".md", "")),
        "date": str(fm.get("date", ""))[:10],  # type: ignore[index]
        "category": fm.get("category", ""),
        "tags": fm.get("tags", []),
        "excerpt": fm.get("excerpt", fm.get("description", "")),
        "coverImage": cover,
        "words": words,
        "read_min": read_min,
        "image_urls": image_urls,
        "has_cover": bool(cover),
        "has_tags": bool(fm.get("tags")),
        "has_excerpt": bool(fm.get("excerpt") or fm.get("description")),
        "has_category": bool(fm.get("category")),
    }


def get_content_audit() -> dict[str, Any]:
    """Scan blog/content/posts for quality issues."""
    posts_dir = os.path.join(os.getcwd(), "blog", "content", "posts")
    if not os.path.isdir(posts_dir):
        return {"total": 0, "issues": [], "healthy": 0, "posts": []}

    issues: list[dict[str, Any]] = []
    posts: list[dict[str, Any]] = []
    total: int = 0
    healthy: int = 0

    for md_file in sorted(glob.glob(os.path.join(posts_dir, "**", "*.md"), recursive=True)):
        total += 1
        try:
            meta = _parse_post_frontmatter(md_file)
            posts.append(meta)

            file_issues = []
            if not meta["has_cover"]:
                file_issues.append("Missing cover")
            if not meta["has_tags"]:
                file_issues.append("No tags")
            if not meta["has_excerpt"]:
                file_issues.append("No excerpt")
            if not meta["has_category"]:
                file_issues.append("No category")

            if file_issues:
                issues.append({"file": meta["filename"], "problems": file_issues})
            else:
                healthy += 1

        except Exception as e:
            issues.append({"file": os.path.basename(md_file), "problems": [str(e)]})

    # Aggregated stats
    total_words = sum(p["words"] for p in posts)
    categories = Counter(p["category"] for p in posts if p["category"])
    tags_counter = Counter(t for p in posts for t in p.get("tags", []))

    return {
        "total": total,
        "issues": issues,
        "healthy": healthy,
        "posts": posts,
        "total_words": total_words,
        "avg_words": round(total_words / total) if total else 0,
        "categories": dict(categories.most_common(10)),
        "top_tags": dict(tags_counter.most_common(15)),
    }


def get_view_stats() -> dict:
    """Fetch view counts from Upstash Redis.

    Uses page_views:* prefix to match the blog's view counter API.
    """
    url = os.getenv("NEXT_PUBLIC_UPSTASH_REDIS_REST_URL")
    token = os.getenv("NEXT_PUBLIC_UPSTASH_REDIS_REST_TOKEN")

    if not url or not token:
        return {"total_views": 0, "posts": [], "error": "Upstash not configured"}

    headers = {"Authorization": f"Bearer {token}"}
    try:
        # Use page_views:* to match blog/app/api/views/[slug]/route.ts
        resp = requests.get(f"{url}/keys/page_views:*", headers=headers, timeout=5)
        data = resp.json()
        keys = data.get("result", [])

        if not keys:
            return {"total_views": 0, "posts": []}

        pipeline_body = [["MGET"] + keys]
        resp = requests.post(
            f"{url}/pipeline",
            headers=headers,
            json=pipeline_body,
            timeout=5,
        )
        pipeline_data = resp.json()
        values = pipeline_data[0].get("result", []) if pipeline_data else []

        posts = []
        total = 0
        for key, val in zip(keys, values):
            # Strip page_views: prefix to get the slug
            slug = key.replace("page_views:", "")
            count = int(val or 0)
            total += count
            posts.append({"slug": slug, "views": count})

        posts.sort(key=lambda x: x["views"], reverse=True)

        # Upstash usage info
        try:
            info_resp = requests.get(f"{url}/info", headers=headers, timeout=5)
            info = info_resp.json().get("result", {})
        except Exception:
            info = {}

        return {"total_views": total, "posts": posts, "upstash_info": info}

    except Exception as e:
        return {"total_views": 0, "posts": [], "error": str(e)}


def _parse_counter(value: Any) -> int:
    try:
        return int(value)
    except (TypeError, ValueError):
        return 0


def _get_analytics_key(scope: str, metric: str, segment: str | None = None) -> str:
    if scope == "site":
        return f"analytics:site:{metric}"

    if not segment:
        raise ValueError(f"segment is required for analytics scope {scope}")

    return f"analytics:{scope}:{quote(segment, safe='')}:{metric}"


def _fetch_upstash_mget(keys: list[str]) -> list[Any]:
    url = os.getenv("NEXT_PUBLIC_UPSTASH_REDIS_REST_URL")
    token = os.getenv("NEXT_PUBLIC_UPSTASH_REDIS_REST_TOKEN")

    if not url or not token or not keys:
        return []

    headers = {"Authorization": f"Bearer {token}"}
    response = requests.post(
        f"{url}/pipeline",
        headers=headers,
        json=[["MGET"] + keys],
        timeout=5,
    )
    data = response.json()
    if not data:
        return []

    return data[0].get("result", [])


def get_article_analytics(posts: list[dict[str, Any]], views_map: dict[str, int]) -> dict:
    if not posts:
        return {
            "totals": {
                "views": 0,
                "cta_clicks": 0,
                "affiliate_clicks": 0,
                "email_opt_ins": 0,
                "consultation_clicks": 0,
                "consultation_submits": 0,
                "consultation_bookings": 0,
                "estimated_revenue_cents": 0,
                "realized_revenue_cents": 0,
                "cta_ctr": 0,
                "email_opt_in_rate": 0,
                "consultation_rate": 0,
                "monetized_articles": 0,
            },
            "top_articles": [],
            "categories": [],
        }

    article_keys: list[str] = []
    for post in posts:
        slug = str(post.get("slug") or post.get("filename", "")).replace(".md", "")
        if not slug:
            continue
        for metric in ANALYTICS_METRICS:
            article_keys.append(_get_analytics_key("article", metric, slug))

    article_values = _fetch_upstash_mget(article_keys)
    article_counts = {
        key: _parse_counter(value) for key, value in zip(article_keys, article_values)
    }

    totals = {
        "views": 0,
        "cta_clicks": 0,
        "affiliate_clicks": 0,
        "email_opt_ins": 0,
        "consultation_clicks": 0,
        "consultation_submits": 0,
        "consultation_bookings": 0,
        "estimated_revenue_cents": 0,
        "realized_revenue_cents": 0,
        "cta_ctr": 0,
        "email_opt_in_rate": 0,
        "consultation_rate": 0,
        "monetized_articles": 0,
    }
    category_totals: dict[str, dict[str, Any]] = {}
    articles: list[dict[str, Any]] = []

    for post in posts:
        slug = str(post.get("slug") or post.get("filename", "")).replace(".md", "")
        if not slug:
            continue

        category = str(post.get("category") or "General")
        metrics = {
            metric: article_counts.get(_get_analytics_key("article", metric, slug), 0)
            for metric in ANALYTICS_METRICS
        }
        views = views_map.get(slug, 0)
        consultation_events = (
            metrics["consultation_bookings"]
            or metrics["consultation_submits"]
            or metrics["consultation_clicks"]
        )
        tracked_article = any(
            (
                metrics["cta_clicks"],
                metrics["affiliate_clicks"],
                metrics["email_opt_ins"],
                metrics["consultation_clicks"],
                metrics["consultation_submits"],
                metrics["consultation_bookings"],
                metrics["estimated_revenue_cents"],
                metrics["realized_revenue_cents"],
            )
        )

        article = {
            "slug": slug,
            "title": post.get("title", slug),
            "category": category,
            "views": views,
            "cta_clicks": metrics["cta_clicks"],
            "affiliate_clicks": metrics["affiliate_clicks"],
            "email_opt_ins": metrics["email_opt_ins"],
            "consultation_clicks": metrics["consultation_clicks"],
            "consultation_submits": metrics["consultation_submits"],
            "consultation_bookings": metrics["consultation_bookings"],
            "estimated_revenue_cents": metrics["estimated_revenue_cents"],
            "realized_revenue_cents": metrics["realized_revenue_cents"],
            "cta_ctr": round((metrics["cta_clicks"] / views) * 100, 2) if views else 0,
            "email_opt_in_rate": round((metrics["email_opt_ins"] / views) * 100, 2) if views else 0,
            "consultation_rate": round((consultation_events / views) * 100, 2) if views else 0,
        }
        articles.append(article)

        totals["views"] += views
        totals["cta_clicks"] += metrics["cta_clicks"]
        totals["affiliate_clicks"] += metrics["affiliate_clicks"]
        totals["email_opt_ins"] += metrics["email_opt_ins"]
        totals["consultation_clicks"] += metrics["consultation_clicks"]
        totals["consultation_submits"] += metrics["consultation_submits"]
        totals["consultation_bookings"] += metrics["consultation_bookings"]
        totals["estimated_revenue_cents"] += metrics["estimated_revenue_cents"]
        totals["realized_revenue_cents"] += metrics["realized_revenue_cents"]
        totals["monetized_articles"] += 1 if tracked_article else 0

        category_entry = category_totals.setdefault(
            category,
            {
                "category": category,
                "views": 0,
                "cta_clicks": 0,
                "affiliate_clicks": 0,
                "email_opt_ins": 0,
                "consultation_clicks": 0,
                "consultation_submits": 0,
                "consultation_bookings": 0,
                "estimated_revenue_cents": 0,
                "realized_revenue_cents": 0,
                "cta_ctr": 0,
                "email_opt_in_rate": 0,
                "consultation_rate": 0,
            },
        )
        category_entry["views"] += views
        category_entry["cta_clicks"] += metrics["cta_clicks"]
        category_entry["affiliate_clicks"] += metrics["affiliate_clicks"]
        category_entry["email_opt_ins"] += metrics["email_opt_ins"]
        category_entry["consultation_clicks"] += metrics["consultation_clicks"]
        category_entry["consultation_submits"] += metrics["consultation_submits"]
        category_entry["consultation_bookings"] += metrics["consultation_bookings"]
        category_entry["estimated_revenue_cents"] += metrics["estimated_revenue_cents"]
        category_entry["realized_revenue_cents"] += metrics["realized_revenue_cents"]

    if totals["views"]:
        totals["cta_ctr"] = round((totals["cta_clicks"] / totals["views"]) * 100, 2)
        totals["email_opt_in_rate"] = round((totals["email_opt_ins"] / totals["views"]) * 100, 2)
        consultation_events = (
            totals["consultation_bookings"]
            or totals["consultation_submits"]
            or totals["consultation_clicks"]
        )
        totals["consultation_rate"] = round((consultation_events / totals["views"]) * 100, 2)

    categories = []
    for category_entry in category_totals.values():
        category_views = category_entry["views"]
        consultation_events = (
            category_entry["consultation_bookings"]
            or category_entry["consultation_submits"]
            or category_entry["consultation_clicks"]
        )
        category_entry["cta_ctr"] = (
            round((category_entry["cta_clicks"] / category_views) * 100, 2) if category_views else 0
        )
        category_entry["email_opt_in_rate"] = (
            round((category_entry["email_opt_ins"] / category_views) * 100, 2)
            if category_views
            else 0
        )
        category_entry["consultation_rate"] = (
            round((consultation_events / category_views) * 100, 2) if category_views else 0
        )
        categories.append(category_entry)

    top_articles = sorted(
        articles,
        key=lambda article: (
            article["realized_revenue_cents"],
            article["estimated_revenue_cents"],
            article["consultation_bookings"],
            article["affiliate_clicks"],
            article["cta_clicks"],
            article["views"],
        ),
        reverse=True,
    )[:12]
    categories.sort(
        key=lambda category: (
            category["realized_revenue_cents"],
            category["estimated_revenue_cents"],
            category["consultation_bookings"],
            category["cta_clicks"],
            category["views"],
        ),
        reverse=True,
    )

    return {
        "totals": totals,
        "top_articles": top_articles,
        "categories": categories[:12],
    }


def get_git_status() -> dict:
    """Get current git status."""
    try:
        result = subprocess.run(
            ["git", "status", "--porcelain"],
            capture_output=True,
            text=True,
            timeout=10,
            cwd=os.getcwd(),
        )
        changes = len([l for l in result.stdout.strip().split("\n") if l.strip()])
        return {"pending_changes": changes, "clean": changes == 0}
    except Exception:
        return {"pending_changes": 0, "clean": True, "error": "git unavailable"}


def get_r2_stats() -> dict:
    """Get R2 bucket statistics."""
    endpoint = os.getenv("R2_ENDPOINT")
    access = os.getenv("R2_ACCESS_KEY")
    secret = os.getenv("R2_SECRET_KEY")
    bucket = os.getenv("R2_BUCKET")

    if not all([endpoint, access, secret, bucket]):
        return {"error": "R2 not configured", "total_objects": 0, "total_size_mb": 0}

    try:
        client = boto3.client(
            "s3",
            endpoint_url=endpoint,
            aws_access_key_id=access,
            aws_secret_access_key=secret,
        )
        paginator = client.get_paginator("list_objects_v2")
        total_objects: int = 0
        total_size: int = 0

        for page in paginator.paginate(Bucket=bucket):
            for obj in page.get("Contents", []):
                total_objects += 1  # type: ignore[operator]
                total_size += obj.get("Size", 0)  # type: ignore[operator]

        return {
            "total_objects": total_objects,
            "total_size_mb": round(total_size / (1024 * 1024), 2),  # type: ignore[call-overload]
            "total_size_bytes": total_size,
            "bucket": bucket,
        }
    except Exception as e:
        return {"error": str(e), "total_objects": 0, "total_size_mb": 0}


def get_publishing_heatmap() -> dict:
    """Build a GitHub-style publishing heatmap from post dates."""
    posts_dir = os.path.join(os.getcwd(), "blog", "content", "posts")
    date_counts = {}

    if os.path.isdir(posts_dir):
        for md_file in glob.glob(os.path.join(posts_dir, "*.md")):
            try:
                with open(md_file, "r", encoding="utf-8") as f:
                    content = f.read(1024)
                if content.startswith("---"):
                    end = content.find("---", 3)
                    if end != -1:
                        fm = yaml.safe_load(content[3:end]) or {}  # type: ignore[index]
                        d = fm.get("date")
                        if d:
                            ds = str(d)[:10]  # type: ignore[index]
                            date_counts[ds] = date_counts.get(ds, 0) + 1
            except Exception:
                pass

    # Generate last 90 days for heatmap
    today = datetime.now().date()
    days = []
    for i in range(89, -1, -1):
        d = today - timedelta(days=i)
        ds = d.isoformat()
        days.append({"date": ds, "count": date_counts.get(ds, 0), "dow": d.weekday()})

    return {"days": days, "total_posts": sum(date_counts.values())}


def get_broken_images() -> list:
    """Scan posts for broken image URLs."""
    posts_dir = os.path.join(os.getcwd(), "blog", "content", "posts")
    broken = []

    if not os.path.isdir(posts_dir):
        return broken

    for md_file in glob.glob(os.path.join(posts_dir, "*.md")):
        filename = os.path.basename(md_file)
        try:
            with open(md_file, "r", encoding="utf-8") as f:
                content = f.read()

            urls = re.findall(r"!\[.*?\]\((https?://[^)]+)\)", content)
            # Also check coverImage in frontmatter
            if content.startswith("---"):
                end = content.find("---", 3)
                if end != -1:
                    fm = yaml.safe_load(content[3:end]) or {}  # type: ignore[index]
                    cover = fm.get("coverImage", "")
                    if cover and cover.startswith("http") and cover not in urls:
                        urls.insert(0, cover)

            for url in urls:
                try:
                    resp = requests.head(url, timeout=5, allow_redirects=True)
                    if resp.status_code >= 400:
                        broken.append({"file": filename, "url": url, "status": resp.status_code})
                except Exception:
                    broken.append({"file": filename, "url": url, "status": "timeout"})

        except Exception:
            pass

    return broken


def get_git_history(limit: int = 20) -> list:
    """Get recent git commits."""
    try:
        result = subprocess.run(
            ["git", "log", f"-{limit}", "--pretty=format:%H|%h|%s|%an|%ar|%ai"],
            capture_output=True,
            text=True,
            timeout=10,
            cwd=os.getcwd(),
        )
        commits = []
        for line in result.stdout.strip().split("\n"):
            if "|" not in line:
                continue
            parts = line.split("|")
            if len(parts) >= 6:
                commits.append(
                    {
                        "hash": parts[0][:8],  # type: ignore[index]
                        "short": parts[1],
                        "message": parts[2],
                        "author": parts[3],
                        "ago": parts[4],
                        "date": parts[5][:10],  # type: ignore[index]
                    }
                )
        return commits
    except Exception:
        return []


def get_content_freshness(posts: list, views_map: dict) -> list:
    """Score each post's freshness (0-100). High = needs attention."""
    today = datetime.now().date()
    scored = []
    for p in posts:
        try:
            pub_date = datetime.strptime(p["date"][:10], "%Y-%m-%d").date()
        except (ValueError, TypeError):
            pub_date = today

        age_days = (today - pub_date).days
        slug = p["filename"].replace(".md", "")
        views = views_map.get(slug, 0)

        # Freshness algorithm:
        # - Age penalty: 1 point per 7 days (max 50)
        # - Low views penalty: 0 views = +30, <5 = +20, <20 = +10
        # - Missing metadata: +5 each
        age_score = min(50, age_days // 7)
        view_score = 30 if views == 0 else (20 if views < 5 else (10 if views < 20 else 0))
        meta_score = 0
        if not p.get("has_cover"):
            meta_score += 5
        if not p.get("has_tags"):
            meta_score += 5
        if not p.get("has_excerpt"):
            meta_score += 5
        if not p.get("has_category"):
            meta_score += 5

        total = min(100, age_score + view_score + meta_score)

        label = (
            "Fresh"
            if total < 25
            else ("OK" if total < 50 else ("Aging" if total < 75 else "Stale"))
        )

        scored.append(
            {
                "filename": p["filename"],
                "title": p["title"],
                "score": total,
                "label": label,
                "age_days": age_days,
                "views": views,
            }
        )

    scored.sort(key=lambda x: x["score"], reverse=True)
    return scored


def get_upstash_usage() -> dict:
    """Get Upstash Redis usage stats."""
    url = os.getenv("NEXT_PUBLIC_UPSTASH_REDIS_REST_URL")
    token = os.getenv("NEXT_PUBLIC_UPSTASH_REDIS_REST_TOKEN")

    if not url or not token:
        return {"error": "Upstash not configured"}

    headers = {"Authorization": f"Bearer {token}"}
    try:
        # Get DB info
        resp = requests.get(f"{url}/info", headers=headers, timeout=5)
        raw = resp.json().get("result", "")

        # Parse INFO response
        info = {}
        if isinstance(raw, str):
            for line in raw.split("\r\n"):
                if ":" in line and not line.startswith("#"):
                    k, v = line.split(":", 1)
                    info[k.strip()] = v.strip()
        elif isinstance(raw, dict):
            info = raw

        # Get DBSIZE
        resp2 = requests.get(f"{url}/dbsize", headers=headers, timeout=5)
        dbsize = resp2.json().get("result", 0)

        return {
            "connected_clients": info.get("connected_clients", "?"),
            "used_memory_human": info.get("used_memory_human", "?"),
            "total_commands": info.get("total_commands_processed", "?"),
            "keyspace_hits": info.get("keyspace_hits", "?"),
            "keyspace_misses": info.get("keyspace_misses", "?"),
            "db_size": dbsize,
            "uptime_seconds": info.get("uptime_in_seconds", "?"),
        }
    except Exception as e:
        return {"error": str(e)}


# ─── API Routes ─────────────────────────────────────────────────


@app.route("/api/status")
def api_status():
    content = get_content_audit()
    views = get_view_stats()

    # Build views lookup for freshness
    views_map = {p["slug"]: p["views"] for p in views.get("posts", [])}
    freshness = get_content_freshness(content.get("posts", []), views_map)
    analytics = get_article_analytics(content.get("posts", []), views_map)

    return jsonify(
        {
            "pipeline": get_pipeline_status(),
            "content": content,
            "views": views,
            "analytics": analytics,
            "git": get_git_status(),
            "r2": get_r2_stats(),
            "heatmap": get_publishing_heatmap(),
            "freshness": freshness,
            "upstash": get_upstash_usage(),
            "timestamp": datetime.now().isoformat(),
        }
    )


@app.route("/api/broken-images")
def api_broken_images():
    """Separate endpoint — takes longer to scan."""
    return jsonify({"broken": get_broken_images()})


@app.route("/api/git-history")
def api_git_history():
    return jsonify({"commits": get_git_history()})


@app.route("/api/activity-log")
def api_activity_log():
    return jsonify({"events": list(_activity_log)})


@app.route("/api/action/sync", methods=["POST"])
def action_sync():
    try:
        from content_sync import SyncConfig, sync_all  # type: ignore[import]

        cfg = SyncConfig()
        count = sync_all(cfg)
        return jsonify({"success": True, "synced": count})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@app.route("/api/action/git", methods=["POST"])
def action_git():
    auto_git = _daemon_state.get("auto_git_ref")
    if auto_git:
        success = auto_git.sync()
        return jsonify({"success": success})
    return jsonify({"success": False, "error": "Auto-git not available"}), 500


# ─── Dashboard HTML ─────────────────────────────────────────────

DASHBOARD_HTML = r"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Linkdinger — Dashboard</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Outfit:wght@600;700;800&family=JetBrains+Mono:wght@400;500&display=swap');

  :root {
    --bg-dark: #0a0a0a;
    --peach: #FF6B35;
    --peach-glow: rgba(255, 107, 53, 0.15);
    --indigo: #6366f1;
    --glass-bg: rgba(255, 255, 255, 0.04);
    --glass-border: rgba(255, 255, 255, 0.08);
    --glass-hover: rgba(255, 255, 255, 0.07);
    --text-primary: #f5f5f5;
    --text-secondary: #a0a0a0;
    --text-muted: #555;
    --green: #22c55e;
    --red: #ef4444;
    --yellow: #eab308;
    --cyan: #06b6d4;
    --font-sans: 'Inter', -apple-system, sans-serif;
    --font-display: 'Outfit', sans-serif;
    --font-mono: 'JetBrains Mono', monospace;
  }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: var(--font-sans);
    background: var(--bg-dark);
    color: var(--text-primary);
    min-height: 100vh;
    overflow-x: hidden;
  }

  /* ──── Ambient Background ──── */
  .ambient { position: fixed; inset: 0; z-index: 0; pointer-events: none; }
  .ambient::before {
    content: ''; position: absolute; top: -20%; left: -10%;
    width: 600px; height: 600px;
    background: radial-gradient(circle, rgba(255,107,53,0.10) 0%, transparent 70%);
    border-radius: 50%; animation: float1 20s ease-in-out infinite;
  }
  .ambient::after {
    content: ''; position: absolute; bottom: -10%; right: -10%;
    width: 500px; height: 500px;
    background: radial-gradient(circle, rgba(99,102,241,0.07) 0%, transparent 70%);
    border-radius: 50%; animation: float2 25s ease-in-out infinite;
  }
  .ambient-third {
    position: fixed; top: 40%; left: 50%;
    width: 400px; height: 400px;
    background: radial-gradient(circle, rgba(6,182,212,0.05) 0%, transparent 70%);
    border-radius: 50%; animation: float3 30s ease-in-out infinite;
    pointer-events: none; z-index: 0;
  }
  @keyframes float1 { 0%,100%{transform:translate(0,0)}50%{transform:translate(80px,60px)} }
  @keyframes float2 { 0%,100%{transform:translate(0,0)}50%{transform:translate(-60px,-40px)} }
  @keyframes float3 { 0%,100%{transform:translate(-50%,0)}50%{transform:translate(-50%,50px)} }

  /* ──── Layout ──── */
  .container { position:relative; z-index:1; max-width:1200px; margin:0 auto; padding:32px 24px; }

  /* ──── Navigation Tabs ──── */
  .nav-tabs {
    display:flex; gap:4px; margin-bottom:24px;
    background: var(--glass-bg); border:1px solid var(--glass-border);
    border-radius:12px; padding:4px; width:fit-content;
  }
  .nav-tab {
    padding:8px 18px; border-radius:8px; border:none;
    background:transparent; color:var(--text-secondary);
    font-family:var(--font-sans); font-size:13px; font-weight:500;
    cursor:pointer; transition:all 0.2s;
  }
  .nav-tab:hover { color:var(--text-primary); background:rgba(255,255,255,0.04); }
  .nav-tab.active {
    background:rgba(255,107,53,0.12); color:var(--peach);
    border:1px solid rgba(255,107,53,0.2);
  }
  .tab-content { display:none; }
  .tab-content.active { display:block; }

  /* ──── Header ──── */
  .header { display:flex; align-items:center; justify-content:space-between; margin-bottom:24px; }
  .header h1 {
    font-family:var(--font-display); font-size:26px; font-weight:800;
    display:flex; align-items:center; gap:10px;
  }
  .header h1 span { color:var(--peach); }
  .status-badge {
    display:inline-flex; align-items:center; gap:6px;
    padding:5px 12px; border-radius:50px;
    font-size:11px; font-weight:600; letter-spacing:0.5px; text-transform:uppercase;
  }
  .status-badge.online { background:rgba(34,197,94,0.1); border:1px solid rgba(34,197,94,0.25); color:var(--green); }
  .status-badge.offline { background:rgba(239,68,68,0.1); border:1px solid rgba(239,68,68,0.25); color:var(--red); }
  .status-dot { width:7px; height:7px; border-radius:50%; animation:pulse 2s ease-in-out infinite; }
  .online .status-dot { background:var(--green); }
  @keyframes pulse { 0%,100%{opacity:1}50%{opacity:0.3} }

  /* ──── Glass Card ──── */
  .glass {
    background:var(--glass-bg);
    backdrop-filter:blur(16px); -webkit-backdrop-filter:blur(16px);
    border:1px solid var(--glass-border); border-radius:14px;
    padding:20px; transition:all 0.3s;
  }
  .glass:hover { background:var(--glass-hover); border-color:rgba(255,255,255,0.1); }

  /* ──── Grid ──── */
  .grid-2 { display:grid; grid-template-columns:1fr 1fr; gap:16px; margin-bottom:16px; }
  .grid-3 { display:grid; grid-template-columns:1fr 1fr 1fr; gap:16px; margin-bottom:16px; }
  .grid-4 { display:grid; grid-template-columns:repeat(4,1fr); gap:12px; margin-bottom:16px; }
  .grid-5 { display:grid; grid-template-columns:repeat(5,1fr); gap:12px; margin-bottom:16px; }
  .full-width { margin-bottom:16px; }
  @media(max-width:900px) {
    .grid-2,.grid-3{grid-template-columns:1fr}
    .grid-4,.grid-5{grid-template-columns:1fr 1fr}
  }

  /* ──── Stat Card ──── */
  .stat-card { text-align:center; padding:16px 12px; }
  .stat-card .icon { font-size:24px; margin-bottom:6px; }
  .stat-card .value {
    font-family:var(--font-display); font-size:28px; font-weight:800;
    color:var(--text-primary); line-height:1.1;
  }
  .stat-card .label {
    font-size:11px; color:var(--text-secondary); margin-top:3px;
    text-transform:uppercase; letter-spacing:0.4px; font-weight:500;
  }

  /* ──── Section Header ──── */
  .section-header { display:flex; align-items:center; justify-content:space-between; margin-bottom:14px; }
  .section-header h2 {
    font-family:var(--font-display); font-size:16px; font-weight:700;
    display:flex; align-items:center; gap:8px;
  }
  .badge-sm {
    font-size:11px; padding:2px 8px; border-radius:6px;
    font-weight:600; font-family:var(--font-mono);
  }

  /* ──── Table ──── */
  .data-table { width:100%; border-collapse:collapse; }
  .data-table th {
    text-align:left; font-size:10px; text-transform:uppercase; letter-spacing:0.5px;
    color:var(--text-muted); padding:6px 10px;
    border-bottom:1px solid var(--glass-border); font-weight:600;
  }
  .data-table td {
    padding:8px 10px; font-size:12px; color:var(--text-secondary);
    border-bottom:1px solid rgba(255,255,255,0.03);
  }
  .data-table tr:hover td { color:var(--text-primary); background:rgba(255,255,255,0.02); }
  .slug { font-family:var(--font-mono); color:var(--peach); font-size:11px; }
  .views-bar { display:flex; align-items:center; gap:6px; }
  .bar-track { flex:1; height:5px; background:rgba(255,255,255,0.05); border-radius:3px; overflow:hidden; }
  .bar-fill { height:100%; background:linear-gradient(90deg,var(--peach),#ff9f6b); border-radius:3px; transition:width 0.6s; }
  .views-num { font-family:var(--font-mono); font-size:11px; font-weight:500; color:var(--text-primary); min-width:36px; text-align:right; }

  /* ──── Tags ──── */
  .tag-sm {
    display:inline-block; padding:1px 6px; border-radius:4px; font-size:10px;
    background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.08);
    color:var(--text-secondary); margin:1px;
  }
  .issue-tag { background:rgba(239,68,68,0.1); border-color:rgba(239,68,68,0.2); color:var(--red); }
  .ok-tag { background:rgba(34,197,94,0.1); border-color:rgba(34,197,94,0.2); color:var(--green); }
  .warn-tag { background:rgba(234,179,8,0.1); border-color:rgba(234,179,8,0.2); color:var(--yellow); }

  /* ──── Heatmap ──── */
  .heatmap { display:flex; gap:3px; flex-wrap:wrap; }
  .heatmap-cell {
    width:12px; height:12px; border-radius:3px;
    background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.03);
    transition:all 0.2s;
  }
  .heatmap-cell[data-count="1"] { background:rgba(255,107,53,0.25); border-color:rgba(255,107,53,0.15); }
  .heatmap-cell[data-count="2"] { background:rgba(255,107,53,0.45); border-color:rgba(255,107,53,0.25); }
  .heatmap-cell[data-count="3"] { background:rgba(255,107,53,0.65); border-color:rgba(255,107,53,0.35); }
  .heatmap-cell:hover { transform:scale(1.4); z-index:2; }
  .heatmap-legend { display:flex; align-items:center; gap:4px; font-size:10px; color:var(--text-muted); margin-top:8px; }
  .heatmap-legend .cell { width:10px; height:10px; border-radius:2px; }

  /* ──── Category Chart ──── */
  .cat-bar { display:flex; align-items:center; gap:8px; margin-bottom:6px; }
  .cat-bar .name { font-size:12px; color:var(--text-secondary); min-width:100px; text-align:right; }
  .cat-bar .track { flex:1; height:8px; background:rgba(255,255,255,0.04); border-radius:4px; overflow:hidden; }
  .cat-bar .fill { height:100%; border-radius:4px; transition:width 0.5s; }
  .cat-bar .num { font-family:var(--font-mono); font-size:11px; color:var(--text-muted); min-width:20px; }

  /* ──── Buttons ──── */
  .btn {
    display:inline-flex; align-items:center; gap:5px;
    padding:7px 14px; border-radius:8px;
    border:1px solid var(--glass-border); background:var(--glass-bg);
    color:var(--text-secondary); font-family:var(--font-sans);
    font-size:12px; font-weight:500; cursor:pointer; transition:all 0.2s;
  }
  .btn:hover { background:var(--glass-hover); color:var(--text-primary); border-color:rgba(255,255,255,0.15); transform:translateY(-1px); }
  .btn:active { transform:translateY(0); }
  .btn-peach { background:rgba(255,107,53,0.12); border-color:rgba(255,107,53,0.3); color:var(--peach); }
  .btn-peach:hover { background:rgba(255,107,53,0.2); }
  .btn:disabled { opacity:0.4; cursor:not-allowed; transform:none!important; }

  .empty-state { text-align:center; padding:24px; color:var(--text-muted); font-size:12px; }

  /* ──── Refresh ──── */
  .refresh-bar { display:flex; align-items:center; justify-content:space-between; margin-bottom:20px; font-size:11px; color:var(--text-muted); }
  .refresh-bar .auto { display:flex; align-items:center; gap:5px; }
  .spinner { display:none; width:12px; height:12px; border:2px solid var(--glass-border); border-top-color:var(--peach); border-radius:50%; animation:spin 0.8s linear infinite; }
  @keyframes spin { to{transform:rotate(360deg)} }

  .footer { text-align:center; padding:24px 0 12px; font-size:10px; color:var(--text-muted); }

  /* ──── Freshness Meter ──── */
  .freshness { display:inline-flex; align-items:center; gap:4px; }
  .freshness-dot { width:8px; height:8px; border-radius:50%; }
  .freshness-dot.fresh { background:var(--green); }
  .freshness-dot.ok { background:var(--cyan); }
  .freshness-dot.aging { background:var(--yellow); }
  .freshness-dot.stale { background:var(--red); }

  /* ──── Commit Timeline ──── */
  .timeline { position:relative; padding-left:20px; }
  .timeline::before {
    content:''; position:absolute; left:6px; top:0; bottom:0;
    width:1px; background:rgba(255,255,255,0.06);
  }
  .timeline-item {
    position:relative; padding:8px 0; font-size:12px;
    border-bottom:1px solid rgba(255,255,255,0.02);
  }
  .timeline-item::before {
    content:''; position:absolute; left:-17px; top:13px;
    width:7px; height:7px; border-radius:50%;
    background:var(--peach); border:2px solid var(--bg-dark);
  }
  .timeline-msg { color:var(--text-secondary); margin-bottom:2px; }
  .timeline-meta { font-size:10px; color:var(--text-muted); display:flex; gap:8px; }

  /* ──── Activity Log ──── */
  .log-item {
    display:flex; gap:10px; padding:6px 0;
    border-bottom:1px solid rgba(255,255,255,0.02); font-size:12px;
  }
  .log-time { font-family:var(--font-mono); font-size:10px; color:var(--text-muted); min-width:70px; }
  .log-type {
    font-size:10px; padding:1px 6px; border-radius:4px;
    font-weight:600; text-transform:uppercase; min-width:50px; text-align:center;
  }
  .log-type.image { background:rgba(99,102,241,0.15); color:var(--indigo); }
  .log-type.sync { background:rgba(6,182,212,0.15); color:var(--cyan); }
  .log-type.git { background:rgba(34,197,94,0.15); color:var(--green); }
  .log-type.error { background:rgba(239,68,68,0.15); color:var(--red); }
  .log-type.info { background:rgba(255,255,255,0.08); color:var(--text-secondary); }

  /* ──── Info Grid ──── */
  .info-grid { display:grid; grid-template-columns:1fr 1fr; gap:8px; }
  .info-item {
    display:flex; justify-content:space-between; padding:8px 10px;
    background:rgba(255,255,255,0.02); border-radius:6px; font-size:12px;
  }
  .info-item .k { color:var(--text-muted); }
  .info-item .v { font-family:var(--font-mono); color:var(--text-primary); font-weight:500; }

  /* ──── Scrollbar ──── */
  ::-webkit-scrollbar { width:6px; }
  ::-webkit-scrollbar-track { background:transparent; }
  ::-webkit-scrollbar-thumb { background:rgba(255,255,255,0.1); border-radius:3px; }
</style>
</head>
<body>
<div class="ambient"></div>
<div class="ambient-third"></div>
<div class="container">

  <!-- Header -->
  <div class="header">
    <h1>🔗 <span>Linkdinger</span></h1>
    <div id="daemon-badge" class="status-badge online">
      <div class="status-dot"></div>
      <span>ONLINE</span>
    </div>
  </div>

  <!-- Nav Tabs -->
  <div class="nav-tabs">
    <button class="nav-tab active" onclick="switchTab('overview',this)">📊 Overview</button>
    <button class="nav-tab" onclick="switchTab('content',this)">📝 Content</button>
    <button class="nav-tab" onclick="switchTab('health',this)">🔍 Health</button>
    <button class="nav-tab" onclick="switchTab('system',this)">⚙️ System</button>
  </div>

  <!-- Refresh Bar -->
  <div class="refresh-bar">
    <div class="auto">
      <div class="spinner" id="spinner"></div>
      <span>Updated: <span id="last-update">—</span></span>
    </div>
    <button class="btn" onclick="refreshData()">↻ Refresh</button>
  </div>

  <!-- ═══════ TAB 1: OVERVIEW ═══════ -->
  <div id="tab-overview" class="tab-content active">

    <!-- Stats Row -->
    <div class="grid-5">
      <div class="glass stat-card">
        <div class="icon">⏱️</div>
        <div class="value" id="stat-uptime">—</div>
        <div class="label">Uptime</div>
      </div>
      <div class="glass stat-card">
        <div class="icon">🖼️</div>
        <div class="value" id="stat-images">0</div>
        <div class="label">Images</div>
      </div>
      <div class="glass stat-card">
        <div class="icon">📝</div>
        <div class="value" id="stat-posts">0</div>
        <div class="label">Posts</div>
      </div>
      <div class="glass stat-card">
        <div class="icon">👁️</div>
        <div class="value" id="stat-views">0</div>
        <div class="label">Total Views</div>
      </div>
      <div class="glass stat-card">
        <div class="icon">☁️</div>
        <div class="value" id="stat-r2">0</div>
        <div class="label">R2 (MB)</div>
      </div>
    </div>

    <!-- Top Posts + Publishing Heatmap -->
    <div class="grid-2">
      <div class="glass">
        <div class="section-header">
          <h2>📊 Top Posts</h2>
        </div>
        <table class="data-table">
          <thead><tr><th>Post</th><th>Views</th></tr></thead>
          <tbody id="top-posts"><tr><td colspan="2" class="empty-state">Loading...</td></tr></tbody>
        </table>
      </div>

      <div>
        <!-- Heatmap -->
        <div class="glass" style="margin-bottom:16px">
          <div class="section-header">
            <h2>📅 Publishing Activity</h2>
            <span class="badge-sm" style="color:var(--text-muted)" id="heatmap-total">0 posts</span>
          </div>
          <div class="heatmap" id="heatmap"></div>
          <div class="heatmap-legend">
            <span>Less</span>
            <div class="cell" style="background:rgba(255,255,255,0.04)"></div>
            <div class="cell" style="background:rgba(255,107,53,0.25)"></div>
            <div class="cell" style="background:rgba(255,107,53,0.45)"></div>
            <div class="cell" style="background:rgba(255,107,53,0.65)"></div>
            <span>More</span>
          </div>
        </div>

        <!-- Categories -->
        <div class="glass">
          <div class="section-header"><h2>🏷️ Categories</h2></div>
          <div id="categories-chart"></div>
        </div>
      </div>
    </div>

    <!-- Quick Actions -->
    <div class="glass full-width">
      <div class="section-header">
        <h2>⚡ Quick Actions</h2>
        <span id="git-status" style="font-size:11px;color:var(--text-muted)"></span>
      </div>
      <div style="display:flex;gap:10px;flex-wrap:wrap">
        <button class="btn btn-peach" onclick="doAction('sync',this)">📝 Force Sync</button>
        <button class="btn btn-peach" onclick="doAction('git',this)">📤 Git Push</button>
        <button class="btn" onclick="scanImages()">🔍 Scan Images</button>
      </div>
    </div>

    <div class="glass full-width">
      <div class="section-header">
        <h2>Article Analytics</h2>
        <span class="badge-sm" style="color:var(--text-muted)" id="analytics-count-badge">0 tracked posts</span>
      </div>
      <div class="grid-5" style="margin-bottom:16px">
        <div class="stat-card" style="background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.04)">
          <div class="value" id="stat-cta-ctr">0%</div>
          <div class="label">CTA CTR</div>
        </div>
        <div class="stat-card" style="background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.04)">
          <div class="value" id="stat-email-rate">0%</div>
          <div class="label">Email Rate</div>
        </div>
        <div class="stat-card" style="background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.04)">
          <div class="value" id="stat-consults">0</div>
          <div class="label">Booked Consults</div>
        </div>
        <div class="stat-card" style="background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.04)">
          <div class="value" id="stat-analytics-revenue">$0.00</div>
          <div class="label">Est. Revenue</div>
        </div>
        <div class="stat-card" style="background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.04)">
          <div class="value" id="stat-realized-revenue">$0.00</div>
          <div class="label">Realized Revenue</div>
        </div>
      </div>
      <div style="overflow-x:auto">
        <table class="data-table">
          <thead>
            <tr>
              <th>Article</th><th>Category</th><th>Views</th><th>CTA CTR</th>
              <th>Affiliate</th><th>Email</th><th>Booked</th><th>Est. Revenue</th><th>Realized</th>
            </tr>
          </thead>
          <tbody id="analytics-rows"><tr><td colspan="9" class="empty-state">Loading...</td></tr></tbody>
        </table>
      </div>
    </div>
  </div>

  <!-- ═══════ TAB 2: CONTENT ═══════ -->
  <div id="tab-content" class="tab-content">
    <div class="grid-3" style="margin-bottom:16px">
      <div class="glass stat-card">
        <div class="value" id="stat-total-words">0</div>
        <div class="label">Total Words</div>
      </div>
      <div class="glass stat-card">
        <div class="value" id="stat-avg-words">0</div>
        <div class="label">Avg Words/Post</div>
      </div>
      <div class="glass stat-card">
        <div class="value" id="stat-r2-objects">0</div>
        <div class="label">R2 Images</div>
      </div>
    </div>

    <div class="glass full-width">
      <div class="section-header">
        <h2>📋 Post Inventory</h2>
        <span class="badge-sm" style="color:var(--text-muted)" id="post-count-badge"></span>
      </div>
      <div style="overflow-x:auto">
        <table class="data-table" id="post-inventory">
          <thead>
            <tr>
              <th>Title</th><th>Date</th><th>Category</th>
              <th>Words</th><th>Cover</th><th>Tags</th><th>Views</th><th>Freshness</th>
            </tr>
          </thead>
          <tbody id="post-rows"><tr><td colspan="8" class="empty-state">Loading...</td></tr></tbody>
        </table>
      </div>
    </div>

    <!-- Tag Cloud -->
    <div class="glass full-width">
      <div class="section-header"><h2>🏷️ Tag Cloud</h2></div>
      <div id="tag-cloud" style="display:flex;flex-wrap:wrap;gap:4px"></div>
    </div>
  </div>

  <!-- ═══════ TAB 3: HEALTH ═══════ -->
  <div id="tab-health" class="tab-content">
    <div class="grid-2">
      <!-- Content Audit -->
      <div class="glass">
        <div class="section-header">
          <h2>🔍 Content Audit</h2>
          <span id="audit-summary" class="badge-sm" style="color:var(--green)"></span>
        </div>
        <div id="audit-list"><div class="empty-state">Loading...</div></div>
      </div>

      <!-- R2 Storage -->
      <div class="glass">
        <div class="section-header"><h2>☁️ R2 Storage</h2></div>
        <div id="r2-details"><div class="empty-state">Loading...</div></div>
      </div>
    </div>

    <!-- Broken Image Scanner -->
    <div class="glass full-width">
      <div class="section-header">
        <h2>🖼️ Image Health</h2>
        <button class="btn" onclick="scanImages()" id="btn-scan">🔍 Scan Now</button>
      </div>
      <div id="image-scan-results">
        <div class="empty-state">Click "Scan Now" to check for broken images in all posts</div>
      </div>
    </div>
    </div>

    <!-- Content Freshness -->
    <div class="glass full-width">
      <div class="section-header">
        <h2>🌡️ Content Freshness</h2>
        <span class="badge-sm" style="color:var(--text-muted)">Higher score = needs attention</span>
      </div>
      <div id="freshness-list"><div class="empty-state">Loading...</div></div>
    </div>
  </div>

  <!-- ═══════ TAB 4: SYSTEM ═══════ -->
  <div id="tab-system" class="tab-content">
    <div class="grid-2">
      <!-- Git History -->
      <div class="glass">
        <div class="section-header">
          <h2>📜 Git History</h2>
          <button class="btn" onclick="loadGitHistory()">↻</button>
        </div>
        <div class="timeline" id="git-timeline">
          <div class="empty-state">Click refresh to load</div>
        </div>
      </div>

      <!-- Upstash Redis -->
      <div class="glass">
        <div class="section-header"><h2>🗄️ Upstash Redis</h2></div>
        <div id="upstash-info"><div class="empty-state">Loading...</div></div>
      </div>
    </div>

    <!-- Activity Log -->
    <div class="glass full-width">
      <div class="section-header">
        <h2>📋 Activity Log</h2>
        <button class="btn" onclick="loadActivityLog()">↻</button>
      </div>
      <div id="activity-log" style="max-height:400px;overflow-y:auto">
        <div class="empty-state">No activity yet — start the daemon to see events</div>
      </div>
    </div>
  </div>

  <div class="footer">Linkdinger Dashboard · localhost:9999</div>
</div>

<script>
let cachedData = null;
const CAT_COLORS = ['#FF6B35','#6366f1','#06b6d4','#22c55e','#eab308','#ec4899','#8b5cf6','#f97316'];

function switchTab(name, btn) {
  document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
  document.getElementById('tab-' + name).classList.add('active');
  btn.classList.add('active');
  // Lazy load system tab data
  if (name === 'system') { loadGitHistory(); loadActivityLog(); }
}

async function refreshData() {
  document.getElementById('spinner').style.display = 'block';
  try {
    const res = await fetch('/api/status');
    cachedData = await res.json();
    render(cachedData);
  } catch(e) { console.error(e); }
  document.getElementById('spinner').style.display = 'none';
}

function render(d) {
  document.getElementById('last-update').textContent = new Date().toLocaleTimeString();

  // Pipeline
  const p = d.pipeline;
  document.getElementById('stat-uptime').textContent = p.uptime;
  document.getElementById('stat-images').textContent = p.images_processed;
  const badge = document.getElementById('daemon-badge');
  badge.className = 'status-badge ' + (p.daemon_running ? 'online' : 'offline');
  badge.querySelector('span').textContent = p.daemon_running ? 'ONLINE' : 'OFFLINE';

  // Content
  const c = d.content;
  document.getElementById('stat-posts').textContent = c.total;
  document.getElementById('stat-total-words').textContent = (c.total_words||0).toLocaleString();
  document.getElementById('stat-avg-words').textContent = (c.avg_words||0).toLocaleString();
  document.getElementById('post-count-badge').textContent = c.total + ' posts';

  // Views
  const v = d.views;
  document.getElementById('stat-views').textContent = (v.total_views||0).toLocaleString();
  const maxV = v.posts.length > 0 ? v.posts[0].views : 1;
  const tbody = document.getElementById('top-posts');
  if (!v.posts.length) {
    tbody.innerHTML = '<tr><td colspan="2" class="empty-state">No views yet</td></tr>';
  } else {
    tbody.innerHTML = v.posts.slice(0,8).map(p => `<tr>
      <td class="slug">${p.slug}</td>
      <td><div class="views-bar"><div class="bar-track"><div class="bar-fill" style="width:${(p.views/maxV*100).toFixed(0)}%"></div></div><span class="views-num">${p.views}</span></div></td>
    </tr>`).join('');
  }

  // Build views lookup
  const viewsMap = {};
  v.posts.forEach(p => viewsMap[p.slug] = p.views);
  const formatMoney = (cents) => `$${((Number(cents) || 0) / 100).toFixed(2)}`;

  // R2
  const r = d.r2;
  document.getElementById('stat-r2').textContent = r.total_size_mb || 0;
  document.getElementById('stat-r2-objects').textContent = r.total_objects || 0;
  document.getElementById('r2-details').innerHTML = r.error && !r.total_objects
    ? `<div class="empty-state">${r.error}</div>`
    : `<div style="font-size:13px;color:var(--text-secondary);line-height:2">
        <div>📦 Bucket: <span class="slug">${r.bucket||'—'}</span></div>
        <div>🖼️ Objects: <strong>${r.total_objects}</strong></div>
        <div>💾 Size: <strong>${r.total_size_mb} MB</strong></div>
      </div>`;

  // Heatmap
  const hm = d.heatmap;
  document.getElementById('heatmap-total').textContent = hm.total_posts + ' posts';
  document.getElementById('heatmap').innerHTML = hm.days.map(day => {
    const cnt = Math.min(day.count, 3);
    const title = day.date + (day.count ? ` (${day.count} post${day.count>1?'s':''})` : '');
    return `<div class="heatmap-cell" data-count="${cnt}" title="${title}"></div>`;
  }).join('');

  // Categories chart
  const cats = c.categories || {};
  const catEntries = Object.entries(cats);
  const maxCat = catEntries.length > 0 ? catEntries[0][1] : 1;
  document.getElementById('categories-chart').innerHTML = catEntries.length === 0
    ? '<div class="empty-state">No categories</div>'
    : catEntries.map(([name,count], i) => `<div class="cat-bar">
        <span class="name">${name}</span>
        <div class="track"><div class="fill" style="width:${(count/maxCat*100)}%;background:${CAT_COLORS[i%CAT_COLORS.length]}"></div></div>
        <span class="num">${count}</span>
      </div>`).join('');

  // Post Inventory
  const posts = (c.posts||[]).sort((a,b) => b.date.localeCompare(a.date));
  document.getElementById('post-rows').innerHTML = posts.map(p => {
    const slug = p.slug || p.filename.replace('.md','');
    const pv = viewsMap[slug] || 0;
    // Find freshness for this post
    const fr = (d.freshness||[]).find(f => f.filename === p.filename);
    const frLabel = fr ? fr.label : '?';
    const frScore = fr ? fr.score : 0;
    const frClass = frLabel.toLowerCase();
    return `<tr>
      <td style="max-width:200px"><span style="font-size:12px;font-weight:500">${p.title}</span></td>
      <td><span class="slug">${p.date||'—'}</span></td>
      <td><span class="tag-sm">${p.category||'—'}</span></td>
      <td style="font-family:var(--font-mono);font-size:11px">${p.words}</td>
      <td>${p.has_cover ? '<span class="tag-sm ok-tag">✓</span>' : '<span class="tag-sm issue-tag">✗</span>'}</td>
      <td>${p.has_tags ? '<span class="tag-sm ok-tag">'+p.tags.length+'</span>' : '<span class="tag-sm issue-tag">✗</span>'}</td>
      <td style="font-family:var(--font-mono);font-size:11px">${pv}</td>
      <td><div class="freshness"><div class="freshness-dot ${frClass}"></div><span style="font-size:11px">${frLabel}</span></div></td>
    </tr>`;
  }).join('');

  // Tag Cloud
  const tags = c.top_tags || {};
  const maxTag = Math.max(...Object.values(tags), 1);
  document.getElementById('tag-cloud').innerHTML = Object.entries(tags).map(([tag,count]) => {
    const size = 11 + (count/maxTag)*8;
    const opacity = 0.5 + (count/maxTag)*0.5;
    return `<span class="tag-sm" style="font-size:${size}px;opacity:${opacity}">${tag} (${count})</span>`;
  }).join('');

  // Content Audit
  document.getElementById('audit-summary').textContent = `${c.healthy}/${c.total}`;
  const auditDiv = document.getElementById('audit-list');
  if (c.issues.length === 0) {
    auditDiv.innerHTML = '<div class="empty-state">✅ All posts healthy</div>';
  } else {
    auditDiv.innerHTML = c.issues.map(i => `<div style="display:flex;gap:8px;padding:6px 0;border-bottom:1px solid rgba(255,255,255,0.03);font-size:12px">
      <span class="slug" style="min-width:140px">${i.file}</span>
      <div>${i.problems.map(p=>'<span class="tag-sm issue-tag">'+p+'</span>').join(' ')}</div>
    </div>`).join('');
  }

  // Article Analytics
  const analytics = d.analytics || {};
  const analyticsTotals = analytics.totals || {};
  document.getElementById('stat-cta-ctr').textContent = `${(analyticsTotals.cta_ctr || 0).toFixed(2)}%`;
  document.getElementById('stat-email-rate').textContent = `${(analyticsTotals.email_opt_in_rate || 0).toFixed(2)}%`;
  document.getElementById('stat-consults').textContent = (analyticsTotals.consultation_bookings || 0).toLocaleString();
  document.getElementById('stat-analytics-revenue').textContent = formatMoney(analyticsTotals.estimated_revenue_cents || 0);
  document.getElementById('stat-realized-revenue').textContent = formatMoney(analyticsTotals.realized_revenue_cents || 0);
  document.getElementById('analytics-count-badge').textContent = `${analyticsTotals.monetized_articles || 0} tracked posts`;

  const analyticsRows = document.getElementById('analytics-rows');
  const topAnalyticsArticles = analytics.top_articles || [];
  if (!topAnalyticsArticles.length) {
    analyticsRows.innerHTML = '<tr><td colspan="9" class="empty-state">No monetization events yet</td></tr>';
  } else {
    analyticsRows.innerHTML = topAnalyticsArticles.map(article => `<tr>
      <td style="max-width:220px"><span style="font-size:12px;font-weight:500">${article.title}</span><div class="slug" style="font-size:10px;margin-top:2px">${article.slug}</div></td>
      <td><span class="tag-sm">${article.category || 'â€”'}</span></td>
      <td style="font-family:var(--font-mono);font-size:11px">${(article.views || 0).toLocaleString()}</td>
      <td style="font-family:var(--font-mono);font-size:11px">${(article.cta_ctr || 0).toFixed(2)}%</td>
      <td style="font-family:var(--font-mono);font-size:11px">${(article.affiliate_clicks || 0).toLocaleString()}</td>
      <td style="font-family:var(--font-mono);font-size:11px">${(article.email_opt_ins || 0).toLocaleString()}</td>
      <td style="font-family:var(--font-mono);font-size:11px">${(article.consultation_bookings || 0).toLocaleString()}</td>
      <td style="font-family:var(--font-mono);font-size:11px">${formatMoney(article.estimated_revenue_cents || 0)}</td>
      <td style="font-family:var(--font-mono);font-size:11px">${formatMoney(article.realized_revenue_cents || 0)}</td>
    </tr>`).join('');
  }

  // Git
  const g = d.git;
  const gitEl = document.getElementById('git-status');
  gitEl.textContent = g.clean ? '✓ Clean' : g.pending_changes + ' changes';
  gitEl.style.color = g.clean ? 'var(--green)' : 'var(--yellow)';

  // Freshness table (Health tab)
  const freshDiv = document.getElementById('freshness-list');
  const fresh = d.freshness || [];
  if (fresh.length === 0) {
    freshDiv.innerHTML = '<div class="empty-state">No posts to score</div>';
  } else {
    freshDiv.innerHTML = `<table class="data-table"><thead><tr><th>Post</th><th>Age</th><th>Views</th><th>Score</th><th>Status</th></tr></thead><tbody>
      ${fresh.map(f => {
        const cls = f.label.toLowerCase();
        return `<tr>
          <td style="font-size:12px;font-weight:500">${f.title}</td>
          <td style="font-family:var(--font-mono);font-size:11px">${f.age_days}d</td>
          <td style="font-family:var(--font-mono);font-size:11px">${f.views}</td>
          <td><div class="views-bar"><div class="bar-track"><div class="bar-fill" style="width:${f.score}%;background:${f.score<25?'var(--green)':f.score<50?'var(--cyan)':f.score<75?'var(--yellow)':'var(--red)'}"></div></div><span class="views-num">${f.score}</span></div></td>
          <td><div class="freshness"><div class="freshness-dot ${cls}"></div><span style="font-size:11px">${f.label}</span></div></td>
        </tr>`;
      }).join('')}</tbody></table>`;
  }

  // Upstash info (System tab)
  const ups = d.upstash || {};
  const upsDiv = document.getElementById('upstash-info');
  if (ups.error) {
    upsDiv.innerHTML = `<div class="empty-state">${ups.error}</div>`;
  } else {
    upsDiv.innerHTML = `<div class="info-grid">
      <div class="info-item"><span class="k">DB Keys</span><span class="v">${ups.db_size||0}</span></div>
      <div class="info-item"><span class="k">Memory</span><span class="v">${ups.used_memory_human||'?'}</span></div>
      <div class="info-item"><span class="k">Total Commands</span><span class="v">${Number(ups.total_commands||0).toLocaleString()}</span></div>
      <div class="info-item"><span class="k">Cache Hits</span><span class="v">${Number(ups.keyspace_hits||0).toLocaleString()}</span></div>
      <div class="info-item"><span class="k">Cache Misses</span><span class="v">${Number(ups.keyspace_misses||0).toLocaleString()}</span></div>
      <div class="info-item"><span class="k">Clients</span><span class="v">${ups.connected_clients||'?'}</span></div>
    </div>`;
  }
}

async function doAction(action, btn) {
  btn.disabled = true; const orig = btn.textContent; btn.textContent = '⏳...';
  try {
    const res = await fetch('/api/action/'+action, {method:'POST'});
    const data = await res.json();
    btn.textContent = data.success ? '✅' : '❌';
    setTimeout(()=>{btn.disabled=false;btn.textContent=orig;refreshData();},1500);
  } catch(e) { btn.textContent='❌'; btn.disabled=false; }
}

async function scanImages() {
  const div = document.getElementById('image-scan-results');
  const btn = document.getElementById('btn-scan');
  div.innerHTML = '<div class="empty-state">⏳ Scanning all image URLs... (may take a moment)</div>';
  if(btn) btn.disabled = true;
  try {
    const res = await fetch('/api/broken-images');
    const data = await res.json();
    if (data.broken.length === 0) {
      div.innerHTML = '<div class="empty-state">✅ All images are healthy!</div>';
    } else {
      div.innerHTML = data.broken.map(b => `<div style="display:flex;gap:8px;padding:6px 0;border-bottom:1px solid rgba(255,255,255,0.03);font-size:12px">
        <span class="slug" style="min-width:140px">${b.file}</span>
        <span class="tag-sm issue-tag">${b.status}</span>
        <span style="font-size:10px;color:var(--text-muted);word-break:break-all">${b.url}</span>
      </div>`).join('');
    }
  } catch(e) { div.innerHTML = '<div class="empty-state">❌ Scan failed</div>'; }
  if(btn) btn.disabled = false;
}

refreshData();
setInterval(refreshData, 30000);

// Lazy-loaded data
async function loadGitHistory() {
  const div = document.getElementById('git-timeline');
  div.innerHTML = '<div class="empty-state">Loading...</div>';
  try {
    const res = await fetch('/api/git-history');
    const data = await res.json();
    if (!data.commits.length) {
      div.innerHTML = '<div class="empty-state">No commits found</div>';
    } else {
      div.innerHTML = data.commits.map(c => `
        <div class="timeline-item">
          <div class="timeline-msg">${c.message}</div>
          <div class="timeline-meta">
            <span class="slug">${c.short}</span>
            <span>${c.ago}</span>
            <span>${c.author}</span>
          </div>
        </div>
      `).join('');
    }
  } catch(e) { div.innerHTML = '<div class="empty-state">Error loading</div>'; }
}

async function loadActivityLog() {
  const div = document.getElementById('activity-log');
  try {
    const res = await fetch('/api/activity-log');
    const data = await res.json();
    if (!data.events.length) {
      div.innerHTML = '<div class="empty-state">No activity yet — start the daemon</div>';
    } else {
      div.innerHTML = data.events.map(e => {
        const time = new Date(e.time).toLocaleTimeString();
        return `<div class="log-item">
          <span class="log-time">${time}</span>
          <span class="log-type ${e.type}">${e.type}</span>
          <span style="color:var(--text-secondary)">${e.message}</span>
          ${e.details ? '<span style="font-size:10px;color:var(--text-muted)">'+e.details+'</span>' : ''}
        </div>`;
      }).join('');
    }
  } catch(e) { div.innerHTML = '<div class="empty-state">Error loading</div>'; }
}
</script>
</body>
</html>"""


@app.route("/")
def dashboard():
    return Response(DASHBOARD_HTML, mimetype="text/html")


def start_dashboard(host="127.0.0.1", port=9999):
    """Start dashboard in a background thread."""

    def run():
        log = logging.getLogger("werkzeug")
        log.setLevel(logging.WARNING)
        app.run(host=host, port=port, debug=False, use_reloader=False)

    thread = threading.Thread(target=run, daemon=True)
    thread.start()
    return thread
