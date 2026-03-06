# Wyrdsheet Developer Workflow

This guide is written for a new developer. If a step uses an unfamiliar tool, ask the agent to explain it before moving on.

## 1. First-Time Setup

### Windows
Prerequisites:
- Git
- Node.js LTS
- Rust
- Visual Studio 2022 Build Tools with the C++ workload

Suggested install commands:

```powershell
winget install --id OpenJS.NodeJS.LTS --exact
winget install --id Rustlang.Rustup --exact
winget install --id Microsoft.VisualStudio.2022.BuildTools --exact --override "--quiet --wait --norestart --nocache --add Microsoft.VisualStudio.Workload.VCTools --includeRecommended"
```

Notes:
- Restart the terminal after installing toolchains.
- If PowerShell blocks `npm`, use `npm.cmd` instead.
- The easiest way to run Tauri on Windows is from `Developer PowerShell for VS 2022` or `x64 Native Tools Command Prompt for VS 2022`.

Project setup:

```powershell
git clone <repo-url>
cd <repo-folder>
npm install
```

### macOS
Prerequisites:
- Git
- Node.js LTS
- Rust
- Xcode Command Line Tools

Suggested setup commands:

```bash
xcode-select --install
curl https://sh.rustup.rs -sSf | sh
brew install node
git clone <repo-url>
cd <repo-folder>
npm install
```

Notes:
- If `brew` is not installed, install Homebrew first or install Node.js from `nodejs.org`.
- Open a new terminal after Rust installation so `cargo` is on your `PATH`.

## 2. Common Commands

Start the desktop app:

```bash
npm run tauri dev
```

If Windows PowerShell blocks `npm`, use:

```powershell
npm.cmd run tauri dev
```

Run the frontend tests:

```bash
npm run test:run
```

Build the frontend:

```bash
npm run build
```

Run the Rust check:

```bash
cargo check --manifest-path src-tauri/Cargo.toml
```

## 3. Daily Development Loop
1. Pull the latest changes from Git.
2. Read `docs/ROADMAP.md`, especially the `Now` section.
3. Pick one small task from `Now`.
4. Ask the agent to explain the task before making changes if anything is unclear.
5. Implement the smallest useful slice of that task.
6. Run only the checks needed to verify that slice.
7. Update `docs/ROADMAP.md` if the task status changed.
8. Commit the work with a clear message.

## 4. Working With the Agent
Good prompts to use:
- `Explain the current codebase structure before we change anything.`
- `Suggest the best next task from docs/ROADMAP.md and explain why.`
- `Implement one small item from the Now list and walk me through it.`
- `Review my changes before I commit them.`
- `Explain this file/function in beginner-friendly terms.`

What the agent should do:
- Explain the next step before substantial work.
- Tell you what command is being run and why when that context matters.
- Keep tasks small enough to verify in one sitting.
- End by telling you what changed, how it was verified, and what to do next.

## 5. Definition of Done
A task is done when:
- the code or docs change needed for the task are in place
- the relevant checks pass
- `docs/ROADMAP.md` reflects the new progress
- the next logical step is identified

## 6. When You Get Stuck
- Ask the agent to explain the error message in plain language.
- Ask for the smallest next debugging step instead of a full rewrite.
- If tooling fails, verify Node, Rust, and platform prerequisites first.
- If Git feels confusing, ask the agent to explain exactly what `status`, `add`, `commit`, and `pull` will do before running them.
