# Wyrdsheet Roadmap

## Product Summary
- Vision: build a polished, local-first desktop character sheet app for solo D&D 5e 2024 players.
- Primary differentiator: guided editing and validation wrapped in a strong paper-sheet presentation.
- Platforms: Windows and macOS.
- Core exchange format: native `.dcsheet` bundles plus dependable print/PDF output.

## Non-Goals for V1
- No cloud sync.
- No collaboration or shared campaign features.
- No multi-system tabletop support.
- No full rules engine or near-complete character builder.
- No broad third-party import/export surface beyond native bundles and print/PDF workflow.

## Milestones

### Milestone 0: Documentation and Workflow Setup
Goal: create a shared source of truth for humans and agents before additional feature work.

Key tasks:
- Add a repo-level `AGENTS.md`.
- Add a canonical roadmap in `docs/ROADMAP.md`.
- Add a beginner-friendly workflow guide in `docs/DEVELOPER_WORKFLOW.md`.

Exit criteria:
- All three documents exist in version control.
- Future work can point to a single `Now` task without inventing scope.
- Agents are instructed to read the roadmap and workflow guide before planning or implementation.

### Milestone 1: Foundation and Alpha Hardening
Goal: make the current alpha easier to maintain, safer to edit, and better covered by tests.

Key tasks:
- Separate domain logic, persistence logic, and UI orchestration so the store becomes thinner.
- Fix visible copy and encoding artifacts in the UI and character summaries.
- Add tests around summary formatting, store flows, and Tauri persistence boundaries.
- Improve save-state, autosave, and command error messaging.
- Harden corrupt-file, missing-asset, and recovery behavior.

Exit criteria:
- Core formatting and document transforms are testable outside the store.
- Store flow coverage includes hydrate, create, open, save, delete, duplicate, and import/export error paths.
- Loading and recovery behavior is clear when files or assets are missing or invalid.
- No known user-facing encoding artifacts remain.

### Milestone 2: Guided Creation and Editing
Goal: help new users make correct sheets faster without building a full rules engine.

Key tasks:
- Add a guided creation flow with required-field prompts and completion hints.
- Auto-calculate derived values by default while preserving existing manual overrides where useful.
- Add lightweight presets and picklists for common 5e 2024 inputs.
- Add clearer validation for numeric ranges, duplicate items, and inconsistent spell/HP states.
- Improve quick in-sheet editing for common play-time actions.

Exit criteria:
- New users can create a usable character sheet with guidance instead of blank-form guesswork.
- Derived stats stay consistent unless intentionally overridden.
- Validation catches common input mistakes before they become persisted bad data.

### Milestone 3: Output, UX, and Local Reliability
Goal: make the app pleasant to use repeatedly and dependable for long-term local storage.

Key tasks:
- Add a dedicated print view with decorated and ink-saver modes.
- Improve library search, sort, archive/delete safety, and empty-state onboarding.
- Strengthen bundle import validation, snapshot backups, and recovery prompts.
- Improve art handling and theme polish without introducing freeform layout editing.

Exit criteria:
- Print/PDF output is deliberate and stable.
- Library actions feel safe and obvious.
- Import/export and backup recovery are dependable for normal user workflows.
- Theme and art presentation feel polished, not prototype-level.

### Milestone 4: Release Hardening for Windows and macOS
Goal: move from polished alpha/beta quality to a trustworthy desktop release.

Key tasks:
- Verify bundle metadata, icons, installer output, and release packaging on both platforms.
- Add a release checklist that includes smoke tests, print/PDF verification, and import/export round-trips.
- Add signing/notarization if credentials are available before v1 release.

Exit criteria:
- Windows and macOS builds pass the release checklist.
- Release artifacts are consistent and ready for non-developer use.
- Any remaining unsigned-distribution caveats are explicit if signing is still deferred.

## Work Queue

### Now
- [ ] Milestone 2: improve quick in-sheet editing for HP, spell slots, conditions, and notes.

### Next
- [ ] Milestone 3: build print view modes for decorated parchment and ink-saver output.
- [ ] Milestone 3: improve library search, sorting, archive/delete safety, and sample onboarding content.

### Later
- [ ] Milestone 3: strengthen bundle validation, snapshot backup handling, and recovery prompts.
- [ ] Milestone 3: polish theme and art handling without opening arbitrary layout editing.
- [ ] Milestone 4: finalize release checklist, packaging verification, and platform-specific bundle polish.

### Done
- [x] Milestone 0: add repo-level agent instructions in `AGENTS.md`.
- [x] Milestone 0: add canonical roadmap and milestone definitions in `docs/ROADMAP.md`.
- [x] Milestone 0: add beginner workflow and onboarding guidance in `docs/DEVELOPER_WORKFLOW.md`.
- [x] Milestone 1: audit `useCharacterStore` responsibilities and document the first extraction seams in `docs/STORE_AUDIT.md`.
- [x] Milestone 1: extract summary sorting, summary patching, and export-name helpers from `useCharacterStore` into `src/lib/characterPresentation.ts`.
- [x] Milestone 1: add tests for summary formatting and other shared character presentation helpers.
- [x] Milestone 1: fix visible encoding artifacts in user-facing separator strings.
- [x] Milestone 1: extract Tauri-heavy character loading, import/export, and art workflows into `src/lib/characterRepository.ts`.
- [x] Milestone 1: add store-flow tests for hydrate, create, open, save, delete, and duplicate behavior.
- [x] Milestone 1: improve user-facing save/error messaging around autosave and failed Tauri commands.
- [x] Milestone 1: design and implement a safe recovery path for corrupt character files or missing assets.
- [x] Milestone 2: design a guided character creation flow with required fields, defaults, and completion hints.
- [x] Milestone 2: define lightweight local presets for common 5e 2024 character choices.
- [x] Milestone 2: add inline validation and completion feedback throughout editing.
- [x] User override: replace the permanent roster sidebar with a dedicated roster screen plus a return-to-roster action.
- [x] User override: redesign the roster screen as a richer landing page with resume actions and recent-sheet sections.
- [x] User override: expand the roster landing screen into a full-viewport dashboard layout on desktop.

## Defaults for Future Work
- Stay desktop-only and local-first for v1.
- Keep D&D 5e 2024 as the only supported ruleset for v1.
- Prefer small, verifiable tasks that can be completed and explained in one session.
- When in doubt, choose reliability, clarity, and guided UX over broader feature scope.
