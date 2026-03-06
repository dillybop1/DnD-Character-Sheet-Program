# Character Store Audit

This note explains what `src/store/useCharacterStore.ts` is doing today and which pieces should move out first.

## Why This Matters
`useCharacterStore` is the main client-side state container for the app. Right now it is also doing several other jobs at the same time:
- storing view state
- mutating character documents
- formatting summary data
- calling Tauri commands
- opening file dialogs
- loading art assets
- translating failures into UI state

That makes the file harder to test and harder to change safely.

## Current Responsibilities

### 1. UI state ownership
The store owns UI-specific state such as:
- `activePage`
- `selectedRegion`
- `search`
- `saveStatus`
- `error`
- `loading`
- `dirty`

This is an appropriate store responsibility and should stay in the store.

### 2. Character document state
The store also owns:
- `summaries`
- `currentCharacter`
- `assetDataUrls`

This should also stay in the store, because components need these values reactively.

### 3. Domain and presentation transforms
The store currently performs several pure data transforms:
- sorting summaries in `sortSummaries()` in `src/store/useCharacterStore.ts`
- choosing a default region in `defaultRegionForPage()` in `src/store/useCharacterStore.ts`
- rebuilding the current character summary inside `updateCurrentCharacter`
- generating the export-safe file name inside `exportCurrentCharacter`

These are pure rules, not state orchestration. They are good candidates to move into small helper modules.

### 4. Persistence orchestration
The store directly calls Tauri functions for:
- list/load/save/delete
- duplicate/import/export
- art attach/remove/load
- file dialog selection

This happens through `src/lib/tauri.ts`, but the store still knows too much about the persistence workflow. For example:
- `openCharacter` must load the character and then separately load all art data
- `importCharacter` must open a file dialog, call import, then open the imported character
- `attachArt` knows how to remove an existing asset, upload a new one, load it, and patch local state

These flows are correct, but they are too detailed for a UI store.

### 5. Async state transitions
Every async action repeats some combination of:
- set loading/error flags
- call Tauri
- patch summaries/current character/assets
- set save status or dirty state
- translate thrown errors into user-facing messages

This repetition is one reason the store is getting dense.

## First Extraction Seams
These are the first seams to extract. They are ordered to minimize risk.

### Seam 1: summary and presentation helpers
Create a pure helper module for summary-related transforms.

Recommended file:
- `src/lib/characterPresentation.ts`

Move or add helpers for:
- summary sorting
- summary patching after character edits
- safe export file-name generation
- any shared headline/subtitle formatting that is currently split between the store and `src/lib/character.ts`

Why first:
- this is pure logic
- it is easy to unit test
- it removes duplication from `updateCurrentCharacter` and `exportCurrentCharacter`

Expected result:
- `updateCurrentCharacter` stops manually rebuilding summary fields inline
- summary formatting can be tested without mocking Zustand or Tauri

### Seam 2: repository-style persistence layer
Create a small service layer that wraps persistence workflows and dialog selection.

Recommended file:
- `src/lib/characterRepository.ts`

This layer should own flows like:
- load a character plus its resolved art assets
- import from dialog selection and return the imported/openable result
- export the current character after destination selection
- attach or replace art for a given slot
- remove art and return the minimum data needed to update store state

Why second:
- it reduces direct knowledge of Tauri command choreography inside the store
- it makes store tests easier because the store can mock one repository object instead of many individual Tauri functions

Expected result:
- the store becomes an orchestrator of state changes, not an implementation detail dump for IO

### Seam 3: pure store transition helpers
Extract pure state transition helpers for common store updates.

Recommended file:
- `src/store/characterStoreTransitions.ts`

Candidate helpers:
- apply opened character state
- merge or replace a summary in the list
- apply a dirty character mutation
- clear current character after delete
- remove asset data from local state

Why third:
- pure state transitions are easier to test than inline `set((state) => ...)` blocks
- it shrinks the size of async actions without changing behavior

Expected result:
- each async action becomes easier to read because IO and state patching are separated

## What Should Stay In The Store
Do not extract these yet:
- the top-level Zustand store shape
- UI state like selected page, selected region, and search
- simple setters like `setSearch`, `setActivePage`, and `setSelectedRegion`

Splitting into multiple stores would add more moving parts before the current file is decomposed.

## Recommended Implementation Order
1. Extract `characterPresentation` helpers and add unit tests.
2. Fix the visible encoding artifacts while touching summary-related formatting.
3. Add repository-style persistence helpers around the Tauri flows.
4. Add store-flow tests using repository mocks.
5. Only then start moving repeated state patching into pure transition helpers.

## Success Criteria For The Refactor
- Summary formatting can be tested without touching Zustand or Tauri.
- The store no longer rebuilds summary objects inline.
- Tauri orchestration is hidden behind a repository/service layer.
- Async store actions are shorter and easier to read.
- Behavior stays the same from the user's point of view.
