import type { CharacterSummary } from "../lib/character";
import { formatLibraryStatus, type SaveStatus } from "../lib/statusFeedback";

type CharacterLibraryProps = {
  summaries: CharacterSummary[];
  currentCharacterId: string | null;
  currentCharacterName: string | null;
  variant?: "sidebar" | "screen";
  search: string;
  saveStatus: SaveStatus;
  loading: boolean;
  onSearchChange: (value: string) => void;
  onSelect: (id: string) => void;
  onCreate: () => void;
  onImport: () => void;
  onDuplicate: () => void;
  onExport: () => void;
  onDelete: () => void;
};

function formatUpdatedAt(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function getInitials(name: string) {
  const parts = name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2);

  if (!parts.length) {
    return "WS";
  }

  return parts.map((part) => part[0]?.toUpperCase() ?? "").join("");
}

export function CharacterLibrary({
  summaries,
  currentCharacterId,
  currentCharacterName,
  variant = "sidebar",
  search,
  saveStatus,
  loading,
  onSearchChange,
  onSelect,
  onCreate,
  onImport,
  onDuplicate,
  onExport,
  onDelete,
}: CharacterLibraryProps) {
  function handleDelete() {
    const label = currentCharacterName
      ? `Delete the sheet "${currentCharacterName}"? This cannot be undone.`
      : "Delete the current sheet? This cannot be undone.";

    if (window.confirm(label)) {
      onDelete();
    }
  }

  const resumeSummary =
    summaries.find((summary) => summary.id === currentCharacterId) ?? summaries[0] ?? null;
  const recentSummaries = summaries.slice(0, 3);
  const portraitCount = summaries.filter((summary) => summary.hasPortrait).length;
  const latestUpdatedLabel = summaries[0]
    ? formatUpdatedAt(summaries[0].updatedAt)
    : "No saved sheets yet";

  function renderCharacterCard(summary: CharacterSummary, tone: "default" | "recent" = "default") {
    const initials = getInitials(summary.name);

    return (
      <button
        aria-label={`Open ${summary.name}`}
        className={`character-card character-card-${tone}${summary.id === currentCharacterId ? " active" : ""}`}
        key={`${tone}-${summary.id}`}
        onClick={() => onSelect(summary.id)}
        type="button"
      >
        <div className="character-card-topline">
          <div aria-hidden="true" className="character-card-seal">
            {initials}
          </div>
          <div className="character-card-meta">
            <span className="library-kicker">
              {tone === "recent" ? "Recently updated" : "Character sheet"}
            </span>
            <span className="summary-meta">{formatUpdatedAt(summary.updatedAt)}</span>
          </div>
          <span className="summary-badge">
            {summary.hasPortrait ? "Portrait ready" : "Needs art"}
          </span>
        </div>
        <h2>{summary.name}</h2>
        <p className="card-subtitle">{summary.classSummary}</p>
        <p className="summary-meta">{summary.subtitle}</p>
      </button>
    );
  }

  if (variant === "screen") {
    return (
      <aside className="library-shell library-shell-screen">
        <div className="library-screen-hero">
          <div className="library-heading">
            <span className="library-kicker">Roster selector</span>
            <h1>Choose your next sheet.</h1>
            <p className="library-copy">
              Reopen a recent hero, start a fresh parchment packet, or import an
              existing `.dcsheet` bundle.
            </p>
          </div>

          <div className="library-stat-grid">
            <div className="library-stat-card">
              <span className="library-kicker">Sheets</span>
              <strong>{summaries.length}</strong>
              <span className="summary-meta">Ready to open</span>
            </div>
            <div className="library-stat-card">
              <span className="library-kicker">Portraits</span>
              <strong>{portraitCount}</strong>
              <span className="summary-meta">Sheets with art</span>
            </div>
            <div className="library-stat-card">
              <span className="library-kicker">Latest update</span>
              <strong>{summaries.length ? "Recent" : "Waiting"}</strong>
              <span className="summary-meta">{latestUpdatedLabel}</span>
            </div>
          </div>

          <div className="library-hero-actions">
            {resumeSummary ? (
              <button
                className="action-button primary"
                onClick={() => onSelect(resumeSummary.id)}
                type="button"
              >
                Resume {resumeSummary.name}
              </button>
            ) : (
              <button className="action-button primary" onClick={onCreate} type="button">
                Create first sheet
              </button>
            )}
            <button className="action-button" onClick={onCreate} type="button">
              New sheet
            </button>
            <button className="ghost-button" onClick={onImport} type="button">
              Import bundle
            </button>
          </div>

          <div className="library-feature-grid">
            <button className="library-feature-card" onClick={onCreate} type="button">
              <span className="library-kicker">Fresh parchment</span>
              <strong>Start a guided sheet</strong>
              <span className="list-note">
                Use presets and setup hints to get to a playable sheet faster.
              </span>
            </button>
            <button className="library-feature-card" onClick={onImport} type="button">
              <span className="library-kicker">Portable bundle</span>
              <strong>Import a `.dcsheet`</strong>
              <span className="list-note">
                Bring in an exported sheet with its local art and layout data.
              </span>
            </button>
          </div>
        </div>

        <div className="library-screen-body">
          <section className="library-section-card">
            <div className="library-section-heading">
              <div>
                <span className="library-kicker">Current tools</span>
                <h2>Manage the active sheet</h2>
              </div>
              <span className="summary-badge">
                {currentCharacterId ? "Sheet selected" : "Select a sheet first"}
              </span>
            </div>
            <div className="library-management-grid">
              <button
                className="ghost-button"
                disabled={!currentCharacterId}
                onClick={onDuplicate}
                type="button"
              >
                Duplicate
              </button>
              <button
                className="ghost-button"
                disabled={!currentCharacterId}
                onClick={onExport}
                type="button"
              >
                Export
              </button>
              <button
                className="ghost-button"
                disabled={!currentCharacterId}
                onClick={handleDelete}
                type="button"
              >
                Delete current sheet
              </button>
            </div>
          </section>

          {recentSummaries.length ? (
            <section className="library-section-card">
              <div className="library-section-heading">
                <div>
                  <span className="library-kicker">Recently updated</span>
                  <h2>Jump back into recent work</h2>
                </div>
                <span className="summary-badge">{recentSummaries.length} ready</span>
              </div>
              <div className="library-recent-grid">
                {recentSummaries.map((summary) => renderCharacterCard(summary, "recent"))}
              </div>
            </section>
          ) : null}

          <section className="library-section-card">
            <div className="library-section-heading">
              <div>
                <span className="library-kicker">All sheets</span>
                <h2>Browse your roster</h2>
              </div>
              <span className="summary-badge">
                {formatLibraryStatus(summaries.length, loading, saveStatus)}
              </span>
            </div>

            <input
              className="library-search"
              onChange={(event) => onSearchChange(event.currentTarget.value)}
              placeholder="Search by name, class, or subtitle"
              type="search"
              value={search}
            />

            <div className="helper-row">
              <span className="library-kicker">Matches</span>
              <span className="summary-meta">
                {search.trim()
                  ? `${summaries.length} ${summaries.length === 1 ? "sheet" : "sheets"} found`
                  : "Sorted by most recently updated"}
              </span>
            </div>

            <div className="library-list library-list-screen">
              {summaries.length ? (
                summaries.map((summary) => renderCharacterCard(summary))
              ) : (
                <div className="empty-page">
                  <div>
                    <h3>No matching sheets</h3>
                    <p className="list-note">
                      {search.trim()
                        ? "Try a broader search, or clear the filter to see the full roster."
                        : "Create your first sheet or import an existing bundle to populate the vault."}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </section>
        </div>

        <div className="library-footer">
          v1 alpha - macOS and Windows release targets - portable `.dcsheet` bundles
        </div>
      </aside>
    );
  }

  return (
    <aside className="library-shell">
      <div className="library-heading">
        <span className="library-kicker">Desktop character vault</span>
        <h1>Wyrdsheet</h1>
        <p className="library-copy">
          Local-first character bundles with art-aware sheets and a live paper-inspired
          workspace.
        </p>
      </div>

      <input
        className="library-search"
        onChange={(event) => onSearchChange(event.currentTarget.value)}
        placeholder="Search your roster"
        type="search"
        value={search}
      />

      <div className="library-toolbar">
        <button className="action-button primary" onClick={onCreate} type="button">
          New
        </button>
        <button className="ghost-button" onClick={onImport} type="button">
          Import
        </button>
        <button
          className="ghost-button"
          disabled={!currentCharacterId}
          onClick={onDuplicate}
          type="button"
        >
          Duplicate
        </button>
        <button
          className="ghost-button"
          disabled={!currentCharacterId}
          onClick={onExport}
          type="button"
        >
          Export
        </button>
      </div>

      <button
        className="ghost-button"
        disabled={!currentCharacterId}
        onClick={handleDelete}
        type="button"
      >
        Delete current sheet
      </button>

      <div className="helper-row">
        <span className="library-kicker">Roster</span>
        <span className="summary-badge">
          {formatLibraryStatus(summaries.length, loading, saveStatus)}
        </span>
      </div>

      <div className="library-list">
        {summaries.length ? (
          summaries.map((summary) => renderCharacterCard(summary))
        ) : (
          <div className="empty-page">
            <div>
              <h3>No characters yet</h3>
              <p className="list-note">
                Create your first sheet or import an existing bundle to populate the vault.
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="library-footer">
        v1 alpha - macOS and Windows release targets - portable `.dcsheet` bundles
      </div>
    </aside>
  );
}
