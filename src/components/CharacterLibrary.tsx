import type { CharacterSummary } from "../lib/character";

type CharacterLibraryProps = {
  summaries: CharacterSummary[];
  currentCharacterId: string | null;
  search: string;
  saveStatus: string;
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

export function CharacterLibrary({
  summaries,
  currentCharacterId,
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
        onClick={onDelete}
        type="button"
      >
        Delete current sheet
      </button>

      <div className="helper-row">
        <span className="library-kicker">Roster</span>
        <span className="summary-badge">
          {loading ? "Loading" : `${summaries.length} sheets`} · {saveStatus}
        </span>
      </div>

      <div className="library-list">
        {summaries.length ? (
          summaries.map((summary) => (
            <button
              className={`character-card${summary.id === currentCharacterId ? " active" : ""}`}
              key={summary.id}
              onClick={() => onSelect(summary.id)}
              type="button"
            >
              <div className="helper-row">
                <span className="summary-badge">{summary.hasPortrait ? "Portrait" : "No art"}</span>
                <span className="summary-meta">{formatUpdatedAt(summary.updatedAt)}</span>
              </div>
              <h2>{summary.name}</h2>
              <p className="card-subtitle">{summary.classSummary}</p>
              <p className="summary-meta">{summary.subtitle}</p>
            </button>
          ))
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
        v1 alpha · macOS and Windows release targets · portable `.dcsheet` bundles
      </div>
    </aside>
  );
}
