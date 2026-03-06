# Wyrdsheet Agent Instructions

## Read First
1. Read `docs/ROADMAP.md`.
2. Read `docs/DEVELOPER_WORKFLOW.md`.
3. Default to the highest-priority unchecked item in `docs/ROADMAP.md` under `Now` unless the user explicitly overrides it.

## Product Direction
- Build a polished, local-first desktop character sheet app for solo D&D 5e 2024 players.
- Favor guided editing, validation, and print/export quality over cloud sync, collaboration, or a full rules engine.
- Treat `.dcsheet` as the canonical exchange format for v1.
- Keep Windows and macOS as the active release targets.

## Working Rules
- Explain the next step in plain language before doing substantial work.
- Keep changes incremental and beginner-friendly.
- Tell the user what command is being run and why when that context matters.
- If the user asks for guidance, recommend the next 1-3 concrete tasks from `docs/ROADMAP.md`.
- Update `docs/ROADMAP.md` whenever milestone status or the `Now / Next / Later / Done` queue materially changes.
- If work intentionally deviates from the roadmap, say so clearly and explain why.

## Coaching Rules
- Assume the user is a new developer.
- Define unfamiliar terms briefly instead of assuming prior knowledge.
- Prefer small, verifiable steps over large refactors.
- Call out prerequisites, risks, and recovery steps before the user can get stuck.
- Do not assume the user already knows Git, Node, Rust, or Tauri.

## End-of-Task Output
End each task by stating:
- what changed
- how it was verified
- the recommended next 1-3 steps
