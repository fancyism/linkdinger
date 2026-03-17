---
stepsCompleted: []
inputDocuments:
  - _bmad-output/planning-artifacts/prd.md
  - docs/ARCHITECTURE.md
  - docs/uxui-principle.md
  - docs/principle-blog.md
  - docs/Dark Glassmorphism-The Aesthetic.md
  - _bmad/bmb/workflows/agent/data/brainstorm-context.md
---

# linkdinger - Epic Breakdown

## Overview

This document provides the complete epic and story breakdown for linkdinger, decomposing the requirements from the PRD, UX Design if it exists, and Architecture requirements into implementable stories.

## Requirements Inventory

### Functional Requirements

FR1: The system shall persist automation jobs in an embedded job store.
FR2: The system shall support the states `draft`, `queued`, `validating`, `researching`, `composing`, `generating_artifacts`, `generating_cover`, `awaiting_cover_approval`, `packaging`, `publishing_youtube`, `building_blog_pack`, `syncing_blog`, `completed`, `failed`, and `cancelled`.
FR3: The unified daemon shall execute automation jobs instead of placing automation logic inside the watcher.
FR4: The automation worker shall run with concurrency `1` in v1.
FR5: The system shall store append-only stage events and error reasons for each job.
FR6: The system shall estimate remaining time using historical stage durations.
FR7: The system shall allow retry from a failed stage when the stage is safe to repeat.
FR8: The system shall allow cancellation before final publish or sync stages.
FR9: The system shall not mutate blog content until a job reaches `syncing_blog`.
FR10: The system shall accept source markdown notes from the vault as automation input.
FR11: The system shall accept additional sources including URLs, PDFs, text blocks, local files, and YouTube playlists.
FR12: The system shall accept per-job prompt addendum provided by the operator.
FR13: The system shall support frontmatter-driven job creation for automation-enabled notes.
FR14: The system shall support dashboard-driven job creation without requiring a note edit first.
FR15: The system shall store the resolved research input set inside the job record.
FR16: The system shall validate missing files, malformed URLs, and unsupported source types before generation begins.
FR17: The system shall preserve compatibility for posts that only use `publish: true` or the `publish/` folder.
FR18: The system shall support artifact types `video`, `podcast`, `slides`, and `infographic` in v1.
FR19: The system shall isolate provider-specific generation logic behind one adapter layer.
FR20: The system shall normalize generated outputs into one artifact manifest schema.
FR21: The artifact manifest shall store `id`, `type`, `status`, `title`, canonical URL, optional download URL, and provider metadata.
FR22: The system shall support partial artifact success so one artifact type can fail while others succeed.
FR23: The system shall allow packaging to continue when the minimum requested artifact set succeeds.
FR24: The system shall record failures per artifact type for operator review.
FR25: The system shall add a dedicated cover generation stage after content composition.
FR26: The system shall use a provider abstraction instead of hard-coding Nano Banana in the daemon.
FR27: The system shall generate a draft cover for every automation-enabled post unless cover generation is disabled or locked.
FR28: The system shall store multiple cover revisions per job.
FR29: The system shall require explicit cover approval before the cover becomes canonical.
FR30: The system shall allow regeneration with prompt variation hints.
FR31: The system shall preserve manual override when `locked: true`.
FR32: The system shall produce one approved hero image and one Open Graph derivative.
FR33: The system shall keep `coverImage` as the final approved visual in post frontmatter.
FR34: The system shall add `coverOgImage` for metadata-specific output.
FR35: The system shall store prompt version, provider name, revision number, and approval timestamp for generated covers.
FR36: The system shall provide one core brand prompt file plus category, series, and topic modifiers for cover generation.
FR37: The generated cover flow shall not depend on WhyralAds in v1.
FR38: The system shall add a separate YouTube publisher adapter.
FR39: The system shall support YouTube metadata fields for title, description, tags, playlist, privacy status, scheduled publish time, and AI disclosure data where required.
FR40: The default YouTube privacy shall be `unlisted`.
FR41: The system shall support `review_then_publish` and `publish_immediately`, with `review_then_publish` as default.
FR42: The system shall store publish results including video ID, watch URL, embed URL, playlist ID, publish status, and error details.
FR43: The system shall block public publishing when cover approval policy has not been satisfied.
FR44: The system shall produce a result pack containing shareable links and blog-ready embed information.
FR45: The dashboard shall add an `Automation` area rather than a separate admin app.
FR46: The dashboard shall provide `Create Job`, `Queue`, `Job Detail`, `Cover Review`, and `Result Pack` views.
FR47: The dashboard shall show stage badges, progress bars, ETA, latest logs, and failure state.
FR48: The dashboard shall provide retry, cancel, approve cover, regenerate cover, publish, and copy result link actions.
FR49: The system shall reuse the existing activity log model where practical.
FR50: The dashboard backend shall expose automation API routes in the existing Flask app.
FR51: The current overview, content audit, git, and health tabs shall remain available.
FR52: The blog post schema shall parse `artifacts`, `researchSources`, `coverOgImage`, `coverMeta`, and `podcast` metadata.
FR53: The post detail view shall render a `Media Capsule` section near the top of the article.
FR54: The blog shall provide a podcast toggle as a reader preference when podcast artifacts exist.
FR55: Open Graph and structured metadata shall prefer `coverOgImage` when present.
FR56: Legacy posts that only use `coverImage` shall continue to render correctly.
FR57: Trending and popular surfaces shall continue to work with the extended post model.
FR58: RSS generation shall remain compatible with the new content model.
FR59: `content_sync.py` shall remain the final handoff into `blog/content/posts`.
FR60: Automation logic shall not be embedded into `obsidian_watcher.py`.
FR61: The sync flow shall write only approved, blog-ready metadata into post content.
FR62: The system shall log every job stage, retry, approval, publish action, and failure event.
FR63: The system shall clean temporary files on failure or cancellation.
FR64: The system shall keep jobs idempotent where safe to repeat.
FR65: The system shall never delete source markdown or manual blog content as part of an automation failure.
FR66: The system shall mask secrets and tokens in logs.
FR67: Automation-enabled publishing and legacy markdown-only publishing shall coexist.

### NonFunctional Requirements

NFR1: The job queue shall remain responsive with one active worker and multiple queued jobs.
NFR2: Partial artifact failure shall not destroy successful outputs.
NFR3: No source content shall be deleted by automation failures.
NFR4: Every operator action and stage transition shall be logged for auditability.
NFR5: Auto-generated covers shall reuse one core Linkdinger theme with controlled modifiers for brand consistency.
NFR6: Existing posts with manual `coverImage` metadata shall continue to render correctly.
NFR7: Artifact generation and cover generation integrations shall remain adapter-based for extensibility.

### Additional Requirements

- The Python daemon in [linkdinger.py](d:/VibeCode.AI/linkdinger/linkdinger.py) remains the orchestration home for new automation scheduling; the watcher remains focused on file events.
- The automation system shall preserve the current event-driven separation where image processing lives in [obsidian_watcher.py](d:/VibeCode.AI/linkdinger/obsidian_watcher.py), git sync lives in [auto_git.py](d:/VibeCode.AI/linkdinger/auto_git.py), and content handoff lives in `content_sync.py`.
- The dashboard integration shall extend the existing local dashboard on port `9999` rather than introducing a new standalone admin surface.
- The frontend shall continue using Next.js 14 App Router with Server Components by default and client components only where interaction requires them.
- Blog content shall continue to be rendered from markdown files under `blog/content/posts`, preserving static generation and file-based publishing.
- Generated media assets and approved cover assets shall use Cloudflare R2 or equivalent object storage compatible with the existing R2 configuration and URL model.
- Existing view-counter and trending surfaces that depend on Upstash Redis shall remain compatible with the new post schema.
- The build and deployment flow shall remain compatible with sitemap generation, RSS generation, and `next build` execution in the current blog project.
- The system shall follow mobile-first responsive design guidance and explicitly define layout, component anatomy, and responsive behavior for new dashboard and blog surfaces.
- Every new interactive UI component shall define default, hover, focused, active, disabled, loading, and error states.
- New UX flows shall include empty, overflow, image-fail, and other edge-case handling rather than assuming ideal data.
- Accessibility requirements shall include keyboard focus visibility, ARIA labels where needed, semantic structure, and color contrast meeting at least WCAG 2.1 AA.
- Dark glassmorphism surfaces shall keep readable white or gray text, 1px boundary borders, ambient gradient backgrounds, and fallback opaque backgrounds when `backdrop-filter` is not supported.
- Glass-heavy surfaces shall respect blur and GPU budgets by preferring moderate blur, limiting dynamic blur usage, and using layer-promotion or pre-rendered effects where useful.
- Blog and dashboard changes shall continue to optimize navigation clarity, searchability, readability, touch targets, and CTA visibility on mobile and desktop.
- Error handling shall remain non-destructive: source files are not deleted on failure, retries remain possible, and temporary artifacts are cleaned up when safe.
- No direct product requirements were extracted from [brainstorm-context.md](d:/VibeCode.AI/linkdinger/_bmad/bmb/workflows/agent/data/brainstorm-context.md); it is treated as supplemental ideation context only.

### FR Coverage Map

{{requirements_coverage_map}}

## Epic List

{{epics_list}}

<!-- Repeat for each epic in epics_list (N = 1, 2, 3...) -->

## Epic {{N}}: {{epic_title_N}}

{{epic_goal_N}}

<!-- Repeat for each story (M = 1, 2, 3...) within epic N -->

### Story {{N}}.{{M}}: {{story_title_N_M}}

As a {{user_type}},
I want {{capability}},
So that {{value_benefit}}.

**Acceptance Criteria:**

<!-- for each AC on this story -->

**Given** {{precondition}}
**When** {{action}}
**Then** {{expected_outcome}}
**And** {{additional_criteria}}

<!-- End story repeat -->
