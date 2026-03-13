---
stepsCompleted: ['step-01-init', 'step-02-discovery', 'step-e-01-discovery']
inputDocuments:
  - config.yaml
  - AGENTS.md
  - docs/principle-blog.md
  - docs/uxui-principle.md
  - docs/ARCHITECTURE.md
  - obsidian_watcher.py
  - auto_git.py
  - linkdinger.py
  - dashboard.py
  - content_sync.py
  - blog/lib/posts.ts
  - blog/app/blog/[slug]/page.tsx
  - blog/components/hero.tsx
  - _bmad/bmb/workflows/agent/data/brainstorm-context.md
workflowType: 'prd'
projectType: 'brownfield'
---

# PRD: Content Automation and Media Publishing Platform

**Author:** Affan  
**Date:** 2026-03-12  
**Project:** Linkdinger  
**Status:** Draft - Feature Breakdown Ready for Architecture and Delivery Planning

---

## 1. Problem Statement

Linkdinger already handles:

- private note storage and git sync
- image upload and markdown replacement
- blog markdown rendering
- dashboard monitoring

But the product still stops at "markdown sync."

There is no operator-friendly system that can:

- take a source note and additional research
- generate multiple media outputs from one content source
- create on-brand cover images automatically
- publish to YouTube with metadata
- package outputs into blog-ready artifacts
- log progress, ETA, retry state, and failures

This creates a broken workflow between content ideation and distribution. The user still has to manually coordinate research, generation, publishing, cover creation, and blog embedding across separate tools.

## 2. Product Vision

> Write once in Obsidian, enrich once, generate once, publish everywhere.

The target experience is:

```text
Obsidian source note
  -> automation intake
  -> research assembly
  -> artifact generation
  -> auto cover generation
  -> YouTube distribution
  -> blog packaging
  -> blog sync and rendering
```

The system must remain:

- local-first
- operator-controlled
- backward-compatible with current markdown publishing
- visually consistent with the Linkdinger design language

## 3. Product Goals

### Primary Goals

1. Turn Linkdinger from a markdown sync tool into a full content automation platform.
2. Let one source note drive multiple outputs: video, podcast, slides, and infographic.
3. Make the dashboard the single control plane for queue, logs, progress, retry, and approvals.
4. Add automatic brand-consistent cover generation as a first-class feature, not a manual afterthought.
5. Produce blog-ready outputs that require little to no manual post-processing.

### Product Principles

- **Source of truth stays in Obsidian:** author intent begins in markdown, not in a separate CMS.
- **Runtime state stays out of notes:** queues, logs, retries, and ETAs live in the automation system.
- **Approval beats surprise:** default behavior is review-first, not public-first.
- **Brand identity must survive automation:** generated covers and media assets must feel like Linkdinger, not random stock output.
- **The old publishing flow must not break:** plain markdown-only publishing still works.

## 4. Out of Scope for v1

- multi-user roles and permissions
- generic web crawling beyond user-provided sources
- exam generation
- multi-vault support
- full no-code workflow builder
- automatic public publishing as the default path
- dependency on WhyralAds

## 5. Feature Breakdown

This PRD is intentionally split by feature so implementation can be scheduled slice by slice.

---

### Feature 1: Automation Job Orchestrator

**Goal:** Add a persistent automation layer between authoring and blog sync.

**User Value:** The operator can create, monitor, retry, and complete jobs without relying on ad hoc scripts or memory.

**Requirements**

- `F1.1` Add a persistent job store for automation runs.
- `F1.2` Support job states: `draft`, `queued`, `validating`, `researching`, `composing`, `generating_artifacts`, `generating_cover`, `awaiting_cover_approval`, `packaging`, `publishing_youtube`, `building_blog_pack`, `syncing_blog`, `completed`, `failed`, `cancelled`.
- `F1.3` Run jobs from the unified daemon rather than the watcher.
- `F1.4` Keep worker concurrency at `1` for v1.
- `F1.5` Store append-only stage events and error reasons.
- `F1.6` Estimate remaining time using historical stage durations, not fixed constants.
- `F1.7` Allow retry from the failed stage when the stage is safe to repeat.
- `F1.8` Allow job cancellation before final publish/sync stages.
- `F1.9` Never mutate blog content until the job reaches `syncing_blog`.

**Dependencies**

- unified daemon
- dashboard state sharing
- SQLite or equivalent embedded store

**Acceptance**

- operator can create a job and see it move from `queued` to `completed` or `failed`
- failed jobs retain logs and can be retried
- ETA is present and updates per stage

---

### Feature 2: Source Intake and Research Assembly

**Goal:** Normalize all author inputs into one job payload.

**User Value:** The user can start from a note they wrote, enrich it with additional context, and avoid manually building prompts from scratch.

**Requirements**

- `F2.1` Accept source markdown notes from the vault.
- `F2.2` Accept additional sources: URLs, PDFs, text blocks, local files, and YouTube playlists.
- `F2.3` Accept prompt addendum from the user per job.
- `F2.4` Allow frontmatter-driven job creation for automation-enabled notes.
- `F2.5` Allow dashboard-driven job creation without forcing note edits first.
- `F2.6` Store the resolved research input set inside the job record.
- `F2.7` Validate missing files, malformed URLs, and unsupported source types before generation begins.
- `F2.8` Preserve backward compatibility for posts that only use `publish: true` or the `publish/` folder.

**Recommended Frontmatter Contract**

```yaml
automation:
  enabled: true
  prompt_addendum: "Audience: Thai school operators"
  research:
    enabled: true
    queries:
      - "K-12 AI adoption trends 2026"
    extra_sources:
      - "https://example.com/report.pdf"
      - "https://youtube.com/playlist?list=PL123"
  outputs:
    - type: video
    - type: podcast
    - type: infographic
  publish_policy: review_then_publish
```

**Acceptance**

- one job can be created from a note plus at least two extra source types
- invalid source inputs fail fast during validation
- legacy markdown-only publishing remains untouched

---

### Feature 3: Artifact Generation Pipeline

**Goal:** Generate multiple media outputs from one normalized content job.

**User Value:** One note can produce several content formats without repeating the research and prompt setup work.

**Requirements**

- `F3.1` Support v1 artifact types: `video`, `podcast`, `slides`, `infographic`.
- `F3.2` Use one generation adapter layer so provider-specific logic stays isolated.
- `F3.3` Normalize generated outputs into one artifact manifest schema.
- `F3.4` Store artifact metadata: `id`, `type`, `status`, `title`, canonical URL, optional download URL, and provider metadata.
- `F3.5` Support partial success: one artifact type may fail while others succeed.
- `F3.6` Allow jobs to continue to packaging if the minimum requested artifact set succeeds.
- `F3.7` Record failures per artifact type for operator review.

**Artifact Manifest Minimum Shape**

```json
{
  "sourceSlug": "ai-strategy-for-schools",
  "jobId": "job_20260312_001",
  "artifacts": [
    {
      "id": "main-video",
      "type": "video",
      "status": "ready"
    }
  ]
}
```

**Acceptance**

- one job can request multiple output types
- successful outputs are visible even if one output type fails
- all generated outputs are normalized into one manifest

---

### Feature 4: Automatic Cover Generation and Theme System

**Goal:** Generate a distinct, on-brand cover image automatically for automation-enabled content.

**User Value:** Every post and media package gets a recognizable, brand-consistent cover without manual design work.

**Product Decision Defaults**

- provider architecture: `pluggable`
- initial provider: `Nano Banana`
- generation policy: `auto draft + approve`
- theme model: `one core theme + dynamic modifiers`

**Requirements**

- `F4.1` Add a dedicated cover generation stage after content composition.
- `F4.2` Use a provider abstraction rather than hard-coding Nano Banana into the daemon.
- `F4.3` Generate a draft cover for every automation-enabled post unless cover generation is disabled or locked.
- `F4.4` Store multiple cover revisions per job.
- `F4.5` Require explicit approval before the cover becomes the canonical post cover.
- `F4.6` Allow operator regeneration with prompt variation hints.
- `F4.7` Preserve manual override with `locked: true`.
- `F4.8` Produce one approved hero image and one OG derivative.
- `F4.9` Keep the existing `coverImage` frontmatter key as the final approved visual.
- `F4.10` Add `coverOgImage` for metadata-specific output.
- `F4.11` Store prompt version, provider name, revision number, and approval timestamp in metadata.
- `F4.12` Add one core brand prompt file plus category/series/topic modifiers.
- `F4.13` The generated cover must not depend on WhyralAds in v1.

**Cover Settings Contract**

```yaml
automation:
  cover:
    mode: auto
    provider: nanobanana
    theme: linkdinger-default
    prompt_addendum: "Emphasize strategic optimism"
    locked: false
```

**Asset Rules**

- master hero image: landscape cover for blog surfaces
- OG image: social derivative from the approved cover
- prompt metadata: stored for reproducibility
- blur placeholder: stored for future UI optimization

**Acceptance**

- a draft cover is created automatically for a qualifying job
- operator can approve or regenerate without restarting the whole job
- approved cover updates final blog-facing metadata
- locked manual covers are never overwritten

---

### Feature 5: YouTube Publishing and Result Pack

**Goal:** Publish generated video outputs to YouTube with automated metadata and return ready-to-use links.

**User Value:** The user gets a publishable YouTube asset and a blog-ready embed package from the same job.

**Requirements**

- `F5.1` Add a separate YouTube publisher adapter.
- `F5.2` Support metadata fields: title, description, tags, playlist, privacy status, scheduled publish time, and AI disclosure metadata where required.
- `F5.3` Default privacy to `unlisted`.
- `F5.4` Support `review_then_publish` and `publish_immediately`, with the first as the default.
- `F5.5` Store publish results: video ID, watch URL, embed URL, playlist ID, publish status, and error details.
- `F5.6` Block public publish if the cover approval policy has not been satisfied.
- `F5.7` Produce a result pack containing shareable links and blog-ready embed info.

**Acceptance**

- a successful video job yields a YouTube URL and an embed URL
- a failed publish keeps the job in a recoverable state
- default publish behavior is unlisted review flow

---

### Feature 6: Dashboard Automation Console

**Goal:** Make automation visible and operable from the existing local dashboard.

**User Value:** The operator can control the entire pipeline without leaving Linkdinger.

**Requirements**

- `F6.1` Add an `Automation` area to the dashboard instead of creating a new admin app.
- `F6.2` Add views for `Create Job`, `Queue`, `Job Detail`, `Cover Review`, and `Result Pack`.
- `F6.3` Show stage badges, progress bars, ETA, latest logs, and failure status.
- `F6.4` Add actions: retry, cancel, approve cover, regenerate cover, publish, and copy result links.
- `F6.5` Reuse the existing activity log model where possible.
- `F6.6` Add automation API routes in the Flask dashboard app.
- `F6.7` Preserve the current overview, content audit, git, and health tabs.

**Acceptance**

- operator can create and manage a job from the dashboard
- operator can review a draft cover before final publish
- job detail page surfaces enough data to diagnose failure without terminal access

---

### Feature 7: Blog Delivery and Reader Experience

**Goal:** Present generated media and approved covers cleanly on the blog without breaking existing posts.

**User Value:** Readers get article, video, and podcast experiences from one post without awkward manual embeds.

**Requirements**

- `F7.1` Extend the post schema to parse `artifacts`, `researchSources`, `coverOgImage`, `coverMeta`, and `podcast`.
- `F7.2` Add a `Media Capsule` section near the top of the post detail view.
- `F7.3` Add a podcast toggle as a reader preference when podcast artifacts exist.
- `F7.4` Prefer `coverOgImage` for Open Graph and structured metadata.
- `F7.5` Preserve current rendering for legacy posts with only `coverImage`.
- `F7.6` Continue to support trending/popular surfaces that already depend on the current post model.
- `F7.7` Keep RSS generation compatible with the new content model.

**Acceptance**

- posts with new artifact metadata render media blocks
- posts without artifact metadata still render unchanged
- Open Graph metadata uses the approved generated OG asset when available

---

### Feature 8: Content Sync, Safety, Logging, and Retry

**Goal:** Integrate automation outputs into the existing publishing pipeline safely.

**User Value:** The system is inspectable, recoverable, and does not corrupt the blog when things go wrong.

**Requirements**

- `F8.1` Keep `content_sync.py` as the final handoff into `blog/content/posts`.
- `F8.2` Do not embed automation logic into `obsidian_watcher.py`.
- `F8.3` Sync only approved, blog-ready metadata into post content.
- `F8.4` Log every job stage, retry, approval action, publish action, and failure event.
- `F8.5` Clean temporary files on failure or cancellation.
- `F8.6` Keep jobs idempotent where safe to repeat.
- `F8.7` Never delete source markdown or manual blog content as part of an automation failure.
- `F8.8` Mask secrets and tokens in logs.
- `F8.9` Keep old markdown publishing flow usable when automation is not enabled.

**Acceptance**

- failed jobs do not corrupt existing blog posts
- temporary files are removed after fail/cancel
- automation and non-automation publishing can coexist

## 6. Non-Functional Requirements

| NFR | Requirement |
|-----|-------------|
| Performance | Job queue remains responsive with one active worker and multiple queued jobs |
| Reliability | Partial artifact failure does not destroy successful outputs |
| Safety | No source content is deleted by automation failures |
| Auditability | Every operator action and stage transition is logged |
| Brand Consistency | Auto-generated covers reuse one core Linkdinger theme with controlled modifiers |
| Backward Compatibility | Existing posts with manual `coverImage` continue to render correctly |
| Extensibility | Cover generation and artifact generation providers are adapter-based |

## 7. Delivery Sequence

Implementation should happen in this order:

1. Feature 1 - Automation Job Orchestrator
2. Feature 2 - Source Intake and Research Assembly
3. Feature 3 - Artifact Generation Pipeline
4. Feature 4 - Automatic Cover Generation and Theme System
5. Feature 6 - Dashboard Automation Console
6. Feature 5 - YouTube Publishing and Result Pack
7. Feature 7 - Blog Delivery and Reader Experience
8. Feature 8 - Content Sync, Safety, Logging, and Retry

This order keeps the system testable at each layer and ensures cover approval exists before public distribution becomes possible.

## 8. Verification Plan

### Per Feature

| Feature | Verification |
|---------|--------------|
| F1 | Create, fail, retry, and cancel jobs via tests and dashboard API |
| F2 | Validate note + URL + file + playlist intake combinations |
| F3 | Generate multiple requested artifact types and inspect normalized manifest |
| F4 | Generate draft cover, approve it, regenerate it, and verify lock behavior |
| F5 | Publish video as unlisted and verify watch/embed URLs are returned |
| F6 | Operate full job lifecycle from dashboard views |
| F7 | Render media capsule and podcast toggle on an automation-enabled post |
| F8 | Fail a job mid-pipeline and verify no blog corruption or temp leakage |

### Global Acceptance Criteria

- [ ] A source note can create an automation job with extra research inputs
- [ ] A job can request at least `video + podcast + infographic` together
- [ ] A draft cover is generated automatically using the configured provider
- [ ] A cover can be approved or regenerated from the dashboard
- [ ] Approved cover metadata updates the final post payload
- [ ] Video artifacts can be published to YouTube as unlisted
- [ ] A blog-ready result pack is available after job completion
- [ ] The post renders generated media without breaking legacy posts
- [ ] The old markdown-only publish path still works
- [ ] Failures are logged with stage-specific context and retry remains possible
