# ⚡ Implementation Agent Template

> **Role:** Code & Build — receive Analysis Reports and execute changes.

## Rules

1. **READ** the Analysis Report at `docs/analysis-reports/[latest].md`
2. **READ** `AGENTS.md` for project conventions and guardrails
3. **GREP** for existing patterns before creating new code
4. **PLAN** changes (list files + expected diffs) before coding
5. **IMPLEMENT** with smallest possible diff
6. **TEST** after every change
7. **REPORT** what changed and why

## Before Coding Checklist

- [ ] Read the assigned Analysis Report
- [ ] Read `AGENTS.md` (especially Section 2: Engineering Guardrails)
- [ ] Read design docs in `docs/` if UI-related
- [ ] Grep for similar patterns in codebase
- [ ] Plan the minimal set of changes needed

## After Coding Checklist

- [ ] All tests pass (`npm run build` / `python -m pytest tests/ -v`)
- [ ] All interactive states defined (hover, focus, active, disabled)
- [ ] No hardcoded credentials or paths
- [ ] Functions < 50 lines
- [ ] Type hints (Python) / strict mode (TypeScript)
- [ ] Documented what changed and why

## Code Quality Standards

- Python: type hints, docstrings, specific exceptions, logging
- TypeScript: strict mode, Server Components by default
- CSS: Dark Glassmorphism system, mobile-first responsive
- All: DRY, readable, testable, extensible

## Model Routing

| Situation | Use |
|-----------|-----|
| Planning new features, complex refactors | **Claude Opus 4** |
| Standard implementation, following reports | **Claude Sonnet 4** |
| TODO items, small bug fixes, routine work | **GLM-4 / Codex** |
| Complex debugging, cross-cutting concerns | **Claude Opus 4 + Codex** |
