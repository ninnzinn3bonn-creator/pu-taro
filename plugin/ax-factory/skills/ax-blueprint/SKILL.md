---
name: ax-blueprint
description: Convert a specific business workflow into a reusable AX Factory blueprint with nodes, prompts, required files, tools, risks, and human approval gates. Use when templating a proven workflow for reuse, documenting an automation design, or preparing a workflow for another property or business.
---

# AX Blueprint

1. Define one narrow workflow with a clear input and output.
2. Separate deterministic processing, AI judgment, and human judgment.
3. Create `.ax-factory/blueprints/<workflow-id>/` containing:
   - `blueprint.json`
   - `runbook.md`
   - `prompt_template.md`
4. In `blueprint.json`, include:
   - `id`, `name`, `businessType`, `description`
   - ordered `nodes`
   - `requiredFiles`, `requiredTools`
   - `allowedActions`, `forbiddenActions`
   - `approvalRules`
   - `successCriteria`
5. Keep external side effects behind explicit approval nodes.
6. Mark unknown integrations as requirements, not implemented capabilities.
7. Use placeholders for property-specific facts and credentials. Never embed secrets.
8. Validate that another operator could identify the current node, next action, and stop condition.
