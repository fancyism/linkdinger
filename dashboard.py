"""
Linkdinger Dashboard — Local admin panel for blog monitoring.

Runs as part of the Linkdinger daemon on http://localhost:9999
Uses Dark Glassmorphism design system.
"""

import os
import json
import glob
import threading
import logging
import subprocess
from datetime import datetime
from pathlib import Path

import yaml
import requests
from flask import Flask, jsonify, Response
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)

app = Flask(__name__)

# ─── Shared State (set by linkdinger.py) ────────────────────────
_daemon_state = {
    "started_at": None,
    "images_processed": 0,
    "posts_synced": 0,
    "last_git_push": None,
    "auto_git_ref": None,       # reference to AutoGit instance
    "sync_config_ref": None,    # reference to SyncConfig instance
}


def set_daemon_state(**kwargs):
    """Called by linkdinger.py to share state with dashboard."""
    _daemon_state.update(kwargs)


# ─── Data Collectors ────────────────────────────────────────────

def get_pipeline_status() -> dict:
    started = _daemon_state.get("started_at")
    uptime = None
    if started:
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


def get_content_audit() -> dict:
    """Scan blog/content/posts for quality issues."""
    posts_dir = os.path.join(os.getcwd(), "blog", "content", "posts")
    if not os.path.isdir(posts_dir):
        return {"total": 0, "issues": [], "healthy": 0}

    issues = []
    total = 0
    healthy = 0

    for md_file in glob.glob(os.path.join(posts_dir, "*.md")):
        total += 1
        filename = os.path.basename(md_file)
        try:
            with open(md_file, "r", encoding="utf-8") as f:
                content = f.read(4096)

            # Parse frontmatter
            if not content.startswith("---"):
                issues.append({"file": filename, "problem": "No frontmatter"})
                continue

            end = content.find("---", 3)
            if end == -1:
                issues.append({"file": filename, "problem": "Broken frontmatter"})
                continue

            fm = yaml.safe_load(content[3:end]) or {}
            file_issues = []

            if not fm.get("coverImage"):
                file_issues.append("Missing cover image")
            if not fm.get("tags") or len(fm.get("tags", [])) == 0:
                file_issues.append("No tags")
            if not fm.get("excerpt") and not fm.get("description"):
                file_issues.append("No excerpt")
            if not fm.get("category"):
                file_issues.append("No category")

            if file_issues:
                issues.append({"file": filename, "problems": file_issues})
            else:
                healthy += 1

        except Exception as e:
            issues.append({"file": filename, "problem": str(e)})

    return {"total": total, "issues": issues, "healthy": healthy}


def get_view_stats() -> dict:
    """Fetch view counts from Upstash Redis."""
    url = os.getenv("NEXT_PUBLIC_UPSTASH_REDIS_REST_URL")
    token = os.getenv("NEXT_PUBLIC_UPSTASH_REDIS_REST_TOKEN")

    if not url or not token:
        return {"total_views": 0, "posts": [], "error": "Upstash not configured"}

    # Get all view keys
    headers = {"Authorization": f"Bearer {token}"}
    try:
        # Get all keys matching views:*
        resp = requests.get(f"{url}/keys/views:*", headers=headers, timeout=5)
        data = resp.json()
        keys = data.get("result", [])

        if not keys:
            return {"total_views": 0, "posts": []}

        # MGET all view counts
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
            slug = key.replace("views:", "")
            count = int(val or 0)
            total += count
            posts.append({"slug": slug, "views": count})

        posts.sort(key=lambda x: x["views"], reverse=True)

        return {"total_views": total, "posts": posts[:10]}

    except Exception as e:
        return {"total_views": 0, "posts": [], "error": str(e)}


def get_git_status() -> dict:
    """Get current git status."""
    try:
        result = subprocess.run(
            ["git", "status", "--porcelain"],
            capture_output=True, text=True, timeout=10,
            cwd=os.getcwd(),
        )
        changes = len([l for l in result.stdout.strip().split("\n") if l.strip()])
        return {"pending_changes": changes, "clean": changes == 0}
    except Exception:
        return {"pending_changes": 0, "clean": True, "error": "git unavailable"}


# ─── API Routes ─────────────────────────────────────────────────

@app.route("/api/status")
def api_status():
    return jsonify({
        "pipeline": get_pipeline_status(),
        "content": get_content_audit(),
        "views": get_view_stats(),
        "git": get_git_status(),
        "timestamp": datetime.now().isoformat(),
    })


@app.route("/api/action/sync", methods=["POST"])
def action_sync():
    """Trigger CMS sync."""
    try:
        from content_sync import SyncConfig, sync_all
        cfg = SyncConfig()
        count = sync_all(cfg)
        return jsonify({"success": True, "synced": count})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@app.route("/api/action/git", methods=["POST"])
def action_git():
    """Trigger git push."""
    auto_git = _daemon_state.get("auto_git_ref")
    if auto_git:
        success = auto_git.sync()
        return jsonify({"success": success})
    return jsonify({"success": False, "error": "Auto-git not available"}), 500


# ─── Dashboard HTML ─────────────────────────────────────────────

DASHBOARD_HTML = """<!DOCTYPE html>
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
    --glass-bg: rgba(255, 255, 255, 0.04);
    --glass-border: rgba(255, 255, 255, 0.08);
    --glass-hover: rgba(255, 255, 255, 0.07);
    --text-primary: #f5f5f5;
    --text-secondary: #a0a0a0;
    --text-muted: #666;
    --green: #22c55e;
    --red: #ef4444;
    --yellow: #eab308;
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

  /* Ambient Background */
  .ambient {
    position: fixed; inset: 0; z-index: 0; pointer-events: none;
  }
  .ambient::before {
    content: '';
    position: absolute;
    top: -20%; left: -10%;
    width: 600px; height: 600px;
    background: radial-gradient(circle, rgba(255,107,53,0.12) 0%, transparent 70%);
    border-radius: 50%;
    animation: float1 20s ease-in-out infinite;
  }
  .ambient::after {
    content: '';
    position: absolute;
    bottom: -10%; right: -10%;
    width: 500px; height: 500px;
    background: radial-gradient(circle, rgba(99,102,241,0.08) 0%, transparent 70%);
    border-radius: 50%;
    animation: float2 25s ease-in-out infinite;
  }
  @keyframes float1 {
    0%, 100% { transform: translate(0, 0); }
    50% { transform: translate(80px, 60px); }
  }
  @keyframes float2 {
    0%, 100% { transform: translate(0, 0); }
    50% { transform: translate(-60px, -40px); }
  }

  /* Layout */
  .container {
    position: relative; z-index: 1;
    max-width: 1100px; margin: 0 auto;
    padding: 40px 24px;
  }

  /* Header */
  .header {
    display: flex; align-items: center; justify-content: space-between;
    margin-bottom: 40px;
  }
  .header h1 {
    font-family: var(--font-display);
    font-size: 28px; font-weight: 800;
    display: flex; align-items: center; gap: 12px;
  }
  .header h1 span { color: var(--peach); }
  .status-badge {
    display: inline-flex; align-items: center; gap: 6px;
    padding: 6px 14px; border-radius: 50px;
    font-size: 12px; font-weight: 600;
    letter-spacing: 0.5px; text-transform: uppercase;
  }
  .status-badge.online {
    background: rgba(34, 197, 94, 0.12);
    border: 1px solid rgba(34, 197, 94, 0.3);
    color: var(--green);
  }
  .status-badge.offline {
    background: rgba(239, 68, 68, 0.12);
    border: 1px solid rgba(239, 68, 68, 0.3);
    color: var(--red);
  }
  .status-dot {
    width: 8px; height: 8px; border-radius: 50%;
    animation: pulse 2s ease-in-out infinite;
  }
  .online .status-dot { background: var(--green); }
  .offline .status-dot { background: var(--red); }
  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.4; }
  }

  /* Glass Card */
  .glass {
    background: var(--glass-bg);
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
    border: 1px solid var(--glass-border);
    border-radius: 16px;
    padding: 24px;
    transition: all 0.3s ease;
  }
  .glass:hover {
    background: var(--glass-hover);
    border-color: rgba(255, 255, 255, 0.12);
  }

  /* Grid */
  .grid-2 {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 20px;
    margin-bottom: 20px;
  }
  .grid-4 {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 16px;
    margin-bottom: 20px;
  }
  @media (max-width: 768px) {
    .grid-2 { grid-template-columns: 1fr; }
    .grid-4 { grid-template-columns: 1fr 1fr; }
  }

  /* Stat Card */
  .stat-card {
    text-align: center;
    padding: 20px 16px;
  }
  .stat-card .icon {
    font-size: 28px;
    margin-bottom: 8px;
    opacity: 0.9;
  }
  .stat-card .value {
    font-family: var(--font-display);
    font-size: 32px; font-weight: 800;
    color: var(--text-primary);
    line-height: 1.1;
  }
  .stat-card .label {
    font-size: 12px;
    color: var(--text-secondary);
    margin-top: 4px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    font-weight: 500;
  }

  /* Section Header */
  .section-header {
    display: flex; align-items: center; justify-content: space-between;
    margin-bottom: 16px;
  }
  .section-header h2 {
    font-family: var(--font-display);
    font-size: 18px; font-weight: 700;
    display: flex; align-items: center; gap: 8px;
  }

  /* Table */
  .data-table {
    width: 100%;
    border-collapse: collapse;
  }
  .data-table th {
    text-align: left;
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    color: var(--text-muted);
    padding: 8px 12px;
    border-bottom: 1px solid var(--glass-border);
    font-weight: 600;
  }
  .data-table td {
    padding: 10px 12px;
    font-size: 13px;
    color: var(--text-secondary);
    border-bottom: 1px solid rgba(255,255,255,0.03);
  }
  .data-table tr:hover td {
    color: var(--text-primary);
    background: rgba(255,255,255,0.02);
  }
  .data-table .slug {
    font-family: var(--font-mono);
    color: var(--peach);
    font-size: 12px;
  }
  .data-table .views-bar {
    display: flex; align-items: center; gap: 8px;
  }
  .bar-track {
    flex: 1; height: 6px;
    background: rgba(255,255,255,0.05);
    border-radius: 3px; overflow: hidden;
  }
  .bar-fill {
    height: 100%;
    background: linear-gradient(90deg, var(--peach), #ff9f6b);
    border-radius: 3px;
    transition: width 0.6s ease;
  }
  .views-num {
    font-family: var(--font-mono);
    font-size: 12px; font-weight: 500;
    color: var(--text-primary);
    min-width: 40px; text-align: right;
  }

  /* Issue List */
  .issue-item {
    display: flex; align-items: flex-start; gap: 10px;
    padding: 10px 0;
    border-bottom: 1px solid rgba(255,255,255,0.03);
    font-size: 13px;
  }
  .issue-item:last-child { border-bottom: none; }
  .issue-file {
    font-family: var(--font-mono);
    color: var(--yellow);
    font-size: 12px;
    min-width: 180px;
  }
  .issue-tags {
    display: flex; flex-wrap: wrap; gap: 4px;
  }
  .issue-tag {
    padding: 2px 8px;
    border-radius: 4px;
    font-size: 11px;
    background: rgba(239, 68, 68, 0.1);
    border: 1px solid rgba(239, 68, 68, 0.2);
    color: var(--red);
  }
  .healthy-tag {
    background: rgba(34, 197, 94, 0.1);
    border: 1px solid rgba(34, 197, 94, 0.2);
    color: var(--green);
  }

  /* Buttons */
  .btn {
    display: inline-flex; align-items: center; gap: 6px;
    padding: 8px 16px;
    border-radius: 8px;
    border: 1px solid var(--glass-border);
    background: var(--glass-bg);
    color: var(--text-secondary);
    font-family: var(--font-sans);
    font-size: 13px; font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
  }
  .btn:hover {
    background: var(--glass-hover);
    color: var(--text-primary);
    border-color: rgba(255,255,255,0.15);
    transform: translateY(-1px);
  }
  .btn:active { transform: translateY(0); }
  .btn.btn-peach {
    background: rgba(255,107,53,0.12);
    border-color: rgba(255,107,53,0.3);
    color: var(--peach);
  }
  .btn.btn-peach:hover {
    background: rgba(255,107,53,0.2);
  }
  .btn:disabled {
    opacity: 0.4; cursor: not-allowed;
    transform: none !important;
  }

  /* Empty State */
  .empty-state {
    text-align: center;
    padding: 32px;
    color: var(--text-muted);
    font-size: 13px;
  }

  /* Refresh indicator */
  .refresh-bar {
    display: flex; align-items: center; justify-content: space-between;
    margin-bottom: 24px;
    font-size: 12px; color: var(--text-muted);
  }
  .refresh-bar .auto {
    display: flex; align-items: center; gap: 6px;
  }
  .spinner {
    display: none;
    width: 14px; height: 14px;
    border: 2px solid var(--glass-border);
    border-top-color: var(--peach);
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }
  .loading .spinner { display: block; }
  @keyframes spin { to { transform: rotate(360deg); } }
  
  /* Footer */
  .footer {
    text-align: center;
    padding: 32px 0 16px;
    font-size: 11px;
    color: var(--text-muted);
    letter-spacing: 0.3px;
  }
</style>
</head>
<body>
<div class="ambient"></div>
<div class="container">

  <!-- Header -->
  <div class="header">
    <h1>🔗 <span>Linkdinger</span> Dashboard</h1>
    <div id="daemon-badge" class="status-badge online">
      <div class="status-dot"></div>
      <span>DAEMON ONLINE</span>
    </div>
  </div>

  <!-- Refresh Bar -->
  <div class="refresh-bar">
    <div class="auto">
      <div class="spinner" id="spinner"></div>
      <span>Last updated: <span id="last-update">—</span></span>
    </div>
    <button class="btn" onclick="refreshData()">↻ Refresh</button>
  </div>

  <!-- Stats Row -->
  <div class="grid-4">
    <div class="glass stat-card">
      <div class="icon">⏱️</div>
      <div class="value" id="stat-uptime">—</div>
      <div class="label">Uptime</div>
    </div>
    <div class="glass stat-card">
      <div class="icon">🖼️</div>
      <div class="value" id="stat-images">0</div>
      <div class="label">Images Uploaded</div>
    </div>
    <div class="glass stat-card">
      <div class="icon">📝</div>
      <div class="value" id="stat-synced">0</div>
      <div class="label">Posts Synced</div>
    </div>
    <div class="glass stat-card">
      <div class="icon">👁️</div>
      <div class="value" id="stat-views">0</div>
      <div class="label">Total Views</div>
    </div>
  </div>

  <!-- Main Grid: Views + Content Audit -->
  <div class="grid-2">

    <!-- Top Posts -->
    <div class="glass">
      <div class="section-header">
        <h2>📊 Top Posts</h2>
      </div>
      <table class="data-table">
        <thead>
          <tr><th>Post</th><th>Views</th></tr>
        </thead>
        <tbody id="top-posts">
          <tr><td colspan="2" class="empty-state">Loading...</td></tr>
        </tbody>
      </table>
    </div>

    <!-- Content Audit -->
    <div class="glass">
      <div class="section-header">
        <h2>🔍 Content Audit</h2>
        <span id="audit-summary" style="font-size:12px;color:var(--text-muted)"></span>
      </div>
      <div id="audit-list">
        <div class="empty-state">Loading...</div>
      </div>
    </div>

  </div>

  <!-- Quick Actions -->
  <div class="glass" style="margin-bottom:20px">
    <div class="section-header">
      <h2>⚡ Quick Actions</h2>
      <span id="git-status" style="font-size:12px;color:var(--text-muted)"></span>
    </div>
    <div style="display:flex;gap:12px;flex-wrap:wrap">
      <button class="btn btn-peach" id="btn-sync" onclick="doAction('sync', this)">📝 Force CMS Sync</button>
      <button class="btn btn-peach" id="btn-git" onclick="doAction('git', this)">📤 Force Git Push</button>
    </div>
  </div>

  <div class="footer">
    Linkdinger Dashboard · Local Only · localhost:9999
  </div>

</div>

<script>
  let maxViews = 1;

  async function refreshData() {
    document.getElementById('spinner').style.display = 'block';
    try {
      const res = await fetch('/api/status');
      const data = await res.json();
      render(data);
    } catch (e) {
      console.error('Fetch error:', e);
    }
    document.getElementById('spinner').style.display = 'none';
  }

  function render(data) {
    // Timestamp
    const now = new Date();
    document.getElementById('last-update').textContent = now.toLocaleTimeString();

    // Pipeline stats
    const p = data.pipeline;
    document.getElementById('stat-uptime').textContent = p.uptime;
    document.getElementById('stat-images').textContent = p.images_processed;
    document.getElementById('stat-synced').textContent = p.posts_synced;

    const badge = document.getElementById('daemon-badge');
    if (p.daemon_running) {
      badge.className = 'status-badge online';
      badge.querySelector('span').textContent = 'DAEMON ONLINE';
    } else {
      badge.className = 'status-badge offline';
      badge.querySelector('span').textContent = 'DAEMON OFFLINE';
    }

    // Views
    const v = data.views;
    document.getElementById('stat-views').textContent = v.total_views.toLocaleString();
    maxViews = v.posts.length > 0 ? v.posts[0].views : 1;

    const tbody = document.getElementById('top-posts');
    if (v.posts.length === 0) {
      tbody.innerHTML = '<tr><td colspan="2" class="empty-state">No view data yet</td></tr>';
    } else {
      tbody.innerHTML = v.posts.map(p => `
        <tr>
          <td class="slug">${p.slug}</td>
          <td>
            <div class="views-bar">
              <div class="bar-track"><div class="bar-fill" style="width:${(p.views/maxViews*100).toFixed(0)}%"></div></div>
              <span class="views-num">${p.views.toLocaleString()}</span>
            </div>
          </td>
        </tr>
      `).join('');
    }

    // Content Audit
    const c = data.content;
    document.getElementById('audit-summary').textContent =
      `${c.healthy}/${c.total} healthy`;

    const auditDiv = document.getElementById('audit-list');
    if (c.issues.length === 0) {
      auditDiv.innerHTML = '<div class="empty-state">✅ All posts are healthy!</div>';
    } else {
      auditDiv.innerHTML = c.issues.map(issue => `
        <div class="issue-item">
          <span class="issue-file">${issue.file}</span>
          <div class="issue-tags">
            ${(issue.problems || [issue.problem]).map(p =>
              `<span class="issue-tag">${p}</span>`
            ).join('')}
          </div>
        </div>
      `).join('');
    }

    // Git status
    const g = data.git;
    const gitEl = document.getElementById('git-status');
    if (g.clean) {
      gitEl.textContent = '✓ Working tree clean';
      gitEl.style.color = 'var(--green)';
    } else {
      gitEl.textContent = `${g.pending_changes} pending change(s)`;
      gitEl.style.color = 'var(--yellow)';
    }
  }

  async function doAction(action, btn) {
    btn.disabled = true;
    btn.textContent = '⏳ Running...';
    try {
      const res = await fetch(`/api/action/${action}`, { method: 'POST' });
      const data = await res.json();
      btn.textContent = data.success ? '✅ Done!' : '❌ Failed';
      setTimeout(() => {
        btn.disabled = false;
        btn.textContent = action === 'sync' ? '📝 Force CMS Sync' : '📤 Force Git Push';
        refreshData();
      }, 2000);
    } catch (e) {
      btn.textContent = '❌ Error';
      btn.disabled = false;
    }
  }

  // Initial load + auto-refresh every 30s
  refreshData();
  setInterval(refreshData, 30000);
</script>
</body>
</html>"""


@app.route("/")
def dashboard():
    return Response(DASHBOARD_HTML, mimetype="text/html")


def start_dashboard(host="127.0.0.1", port=9999):
    """Start dashboard in a background thread."""
    def run():
        # Suppress Flask request logs
        log = logging.getLogger("werkzeug")
        log.setLevel(logging.WARNING)
        app.run(host=host, port=port, debug=False, use_reloader=False)

    thread = threading.Thread(target=run, daemon=True)
    thread.start()
    return thread
