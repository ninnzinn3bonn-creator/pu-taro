# AX Factory repository guidance

## Scope

This repository contains:

- the React/Vite AX Factory Overlay at the repository root
- JSON demo/state data under `public/data`
- the installable Codex plugin under `plugin/ax-factory`
- validation and state bridge scripts under `scripts`

## Required checks

Run these after changes:

```powershell
npm run build
npm run lint
npm run check:data
npm run test:hooks
npm run validate:plugin
```

Validate every bundled skill:

```powershell
$validator = "$env:USERPROFILE\.codex\skills\.system\skill-creator\scripts\quick_validate.py"
Get-ChildItem -Directory plugin\ax-factory\skills | ForEach-Object {
  python $validator $_.FullName
}
```

## Safety

- Keep email sending, price changes, refunds, booking changes, personal data handling, and formal external staff requests behind human approval gates.
- Do not store prompt bodies, secrets, guest data, API keys, or transcript contents in Hook state.
- Preserve stable JSON IDs and validate references after editing data.
- Treat `public/data/state.json` as replaceable runtime state.

## UI

- Keep the primary desktop control-room layout usable at 1280×720.
- Maintain visible distinctions for `running`, `waiting_input`, `waiting_approval`, `completed`, `error`, and `idle`.
- After significant frontend changes, verify the app at `http://127.0.0.1:4173`.
