# Wyrdsheet

Wyrdsheet is a paper-inspired desktop character sheet app for Dungeons & Dragons.
It uses a Tauri desktop shell with a React + TypeScript frontend, stores characters locally,
and imports or exports portable `.dcsheet` bundles that include sheet art assets.

## Current MVP

- Local library for multiple characters
- Three-page parchment-inspired sheet workspace
- Live sheet preview with right-side inspector editing
- Portrait, feature art, and spell art slots
- Native bundle storage and `.dcsheet` import/export
- Local autosave with backup-aware file writes
- Unit tests for the character model and build checks for the desktop app

## Tech Stack

- Tauri 2
- React 19
- TypeScript
- Zustand
- React Hook Form
- Zod
- Rust for filesystem and bundle handling

## Local Setup

1. Install the Rust toolchain if it is not already available.
2. Install frontend dependencies with `npm install`.
3. Start the app with `npm run tauri dev`.

## Useful Commands

- `npm run test:run`
- `npm run build`
- `cargo check --manifest-path src-tauri/Cargo.toml`
- `npm run tauri build`

## Storage Model

Local working storage lives in the Tauri app data directory:

- `characters/<character-id>/character.json`
- `characters/<character-id>/assets/*`

Portable exports use the `.dcsheet` extension and are zip bundles containing:

- `character.json`
- `assets/*`

## Release Flow

- CI runs tests, frontend build, and Rust checks on macOS and Windows.
- Tagged builds trigger the release workflow and attach desktop bundle artifacts to a GitHub Release.
- Signing and notarization are intentionally deferred for this alpha phase.
