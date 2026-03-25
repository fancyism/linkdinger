## Summary

- **Bilingual blog system**: Full `[locale]` routing with Gemini-powered auto-translation, per-locale content under `blog/content/posts/{en,th}/`, and i18n message catalogs
- **Conversion funnel analytics**: Redis-backed instrumentation with public + secure ingestion paths, CTA/affiliate/email/consultation tracking, and revenue attribution
- **Upstash abstraction**: Shared `fetchUpstashJson` + `getUpstashRestConfig` helpers replace scattered fetch patterns across views and analytics routes
- **Dashboard monetization panel**: New article-level analytics section with CTA CTR, email rate, booked consults, estimated and realized revenue

## Bilingual SEO (8 commits)

| Area | What changed |
|------|-------------|
| **Routing** | All pages moved under `app/[locale]/` with `generateStaticParams` for `en` and `th`. `proxy.ts` middleware redirects `/` to `/en/`. |
| **Content** | Posts reorganized into `content/posts/en/` and `content/posts/th/`. Each locale has full frontmatter parity. |
| **i18n** | `blog/messages/{en,th}.ts` catalogs, `blog/i18n/{routing,request,navigation}.ts` config, `next-intl` in layouts. |
| **Posts lib** | `lib/posts.ts` gains locale-aware slug resolution, translated post href maps, and RSS generation per locale. |
| **Feed/Sitemap** | `public/en/rss.xml`, `public/th/rss.xml`, expanded `sitemap.xml` with `xhtml:link` hreflang alternates. |
| **Tests** | `locale-switch.test.ts`, `share.test.ts`, `view-counts.test.ts` added. Existing tests updated for locale-aware slugs. |
| **Translation** | `content_sync.py` auto-translates new posts via Gemini when `autoTranslate: true`. `translation_service.py` handles provider abstraction. |

## Analytics Instrumentation (staged changes)

| Area | What changed |
|------|-------------|
| **Core lib** | `blog/lib/analytics.ts` - event names, metric mappings, Redis key helpers, `buildAnalyticsIncrementCommands` that fans out across site/article/category/CTA scopes |
| **Ingest lib** | `blog/lib/analytics-ingest.ts` - token parsing, payload normalization, dedupe key generation for secure events |
| **Client lib** | `blog/lib/analytics-client.ts` - browser-side `trackAnalyticsEvent` + `rememberArticleAttribution` |
| **Public route** | `blog/app/api/analytics/route.ts` - accepts public events (affiliate_click, email_opt_in, consultation_click), validates payload, writes to Upstash |
| **Secure route** | `blog/app/api/analytics/conversions/route.ts` - token-protected endpoint for consultation_booked / revenue_realized, with TTL-based deduplication |
| **Components** | `tracked-external-link.tsx` wraps anchor tags with click tracking. `article-attribution.tsx` stores slug/locale/category in localStorage. `affiliate-card.tsx` and `newsletter-form.tsx` instrumented with tracking. |
| **Dashboard** | `dashboard.py` gains `ANALYTICS_METRICS`, `get_article_analytics()`, and a new HTML panel showing per-article monetization stats |
| **Tests** | `analytics.test.ts` (112 lines) and `analytics-ingest.test.ts` (114 lines) covering key encoding, command fan-out, token auth, payload normalization |

## Env / Docs Cleanup

- Removed redundant `blog/.env.example`; consolidated into single root `.env.example` with grouped sections
- Updated `README.md` and `CONTRIBUTING.md` with canonical env workflow

## Verification

```
Python tests:  133 passed
Blog tests:    66 passed
Blog build:    Compiled + SSG prerendered (16.1.7)
```

## Key Architecture Decisions

- **Two ingestion tiers**: Public events (no auth, client-POSTed) vs secure events (token-protected, server-POSTed). Separates consumer-facing CTA metrics from revenue-sensitive conversions.
- **Redis key scoping**: `analytics:{scope}:{segment}:{metric}` where scope is {site, article, category, cta}. Enables rollup at any level without aggregation queries.
- **Upstash pipeline**: All increment commands batched into a single `/pipeline` call per event. Minimizes round-trips.
- **Deduplication for revenue**: `SET NX EX` with 7-day TTL prevents double-counting from webhook retries.

## Known Items (post-merge)

- Add rate limiting / origin validation to `/api/analytics` public endpoint
- Validate `revenueCents >= 0` in `normalizePayload`
- Review `blog/lib/analytics-client.ts` for SSRF safety on `outboundUrl`
