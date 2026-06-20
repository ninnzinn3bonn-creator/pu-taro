---
name: ax-map
description: Map a workspace's business operations, tasks, Codex sessions, files, prompts, logs, and approval points into AX Factory JSON. Use when creating or refreshing the factory map, inventorying automation work, or converting existing project artifacts into business areas and lines.
---

# AX Map

1. Locate the data directory:
   - Use `AX_FACTORY_DATA_DIR` when set.
   - Otherwise use `public/data` when it already contains AX Factory JSON.
   - Otherwise create `.ax-factory/data` in the current workspace.
2. Read existing business docs, task lists, run logs, prompts, and relevant source files. Do not read or copy secrets.
3. Preserve stable IDs from existing JSON. Create kebab-case IDs only for new records.
4. Update these files when present or required:
   - `business_areas.json`
   - `tasks.json`
   - `agents.json`
   - `codex_sessions.json`
   - `runs.json`
   - `approvals.json`
5. Model each business area as a facility and each workflow as ordered nodes:
   - `input`
   - `machine`
   - `approval`
   - `output`
6. Add an approval node before external messages, price changes, refunds, bookings, personal-data handling, or formal staff requests.
7. Keep progress evidence-based. Do not infer completion from plans or drafts.
8. Validate referential integrity before finishing. If the workspace has `npm run check:data`, run it.
9. Report changed files, newly mapped areas, blocked lines, and missing source information.
