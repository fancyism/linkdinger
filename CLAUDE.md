# Claude Code Instructions for Linkdinger

> Ground rules for Claude Code CLI and Claude-based IDE agents.

## Project Context

Read `AGENTS.md` FIRST — it contains the full project context, design system,
and engineering guardrails.

## Team Roles

### When acting as ANALYSIS agent

- Read `AGENTS.md`, `config.yaml`, and `docs/` first
- **NEVER modify any project files**
- Output analysis reports to `docs/analysis-reports/` only
- Follow the template in `.agents/prompts/analysis-template.md`

### When acting as IMPLEMENTATION agent

- Read the latest analysis report in `docs/analysis-reports/`
- Follow `AGENTS.md` guardrails (Section 2)
- Follow the template in `.agents/prompts/implement-template.md`
- Run tests after every change
- Functions < 50 lines, type hints, docstrings

### When writing UNIT TESTS

- Read the test coverage report in `docs/analysis-reports/`
- Follow `.agents/prompts/test-coverage-template.md` for classification
- Python tests: `pytest` in `tests/`
- TypeScript tests: `Vitest` in `blog/__tests__/`
- Complex tests (race conditions, debounce, async): Claude Opus 4
- Standard tests (CRUD, utils, components): Claude Sonnet 4

## Design System

- Dark Glassmorphism + Neubrutalism accents
- Always use ambient gradients behind glass elements
- White text on dark surfaces only
- All interactive states: hover, focus, active, disabled, loading, error

## Testing Commands

```bash
# Python
python -m pytest tests/ -v

# Blog
cd blog && npm run build

# Full verification
.\scripts\verify.ps1 -Scope "all"
```
