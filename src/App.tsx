import {
  startTransition,
  useDeferredValue,
  useEffect,
  useEffectEvent,
  useState,
  useTransition,
} from "react";
import { CharacterLibrary } from "./components/CharacterLibrary";
import { CreateCharacterDialog } from "./components/CreateCharacterDialog";
import { InspectorPanel } from "./components/InspectorPanel";
import { SheetWorkspace } from "./components/SheetWorkspace";
import { summarizeCharacterHeadline } from "./lib/characterPresentation";
import { getSaveStatusLabel, getSaveStatusTone } from "./lib/statusFeedback";
import { useCharacterStore } from "./store/useCharacterStore";

function App() {
  const {
    summaries,
    currentCharacter,
    assetDataUrls,
    activePage,
    selectedRegion,
    search,
    saveStatus,
    error,
    notice,
    loading,
    dirty,
    hydrate,
    setSearch,
    setActivePage,
    setSelectedRegion,
    createCharacter,
    openCharacter,
    saveCurrentCharacter,
    updateCurrentCharacter,
    duplicateCurrentCharacter,
    deleteCurrentCharacter,
    importCharacter,
    exportCurrentCharacter,
    attachArt,
    removeArt,
  } = useCharacterStore();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const deferredSearch = useDeferredValue(search);
  const [isPending, startUiTransition] = useTransition();

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  const autoSave = useEffectEvent(async () => {
    await saveCurrentCharacter();
  });

  useEffect(() => {
    if (!dirty || !currentCharacter) {
      return;
    }

    const timer = window.setTimeout(() => {
      void autoSave();
    }, 900);

    return () => {
      window.clearTimeout(timer);
    };
  }, [currentCharacter, dirty, autoSave]);

  const filteredSummaries = summaries.filter((summary) => {
    if (!deferredSearch.trim()) {
      return true;
    }

    const query = deferredSearch.toLowerCase();
    return [summary.name, summary.classSummary, summary.subtitle]
      .filter(Boolean)
      .join(" ")
      .toLowerCase()
      .includes(query);
  });

  const headline = currentCharacter
    ? summarizeCharacterHeadline(currentCharacter)
    : "Build a parchment-style sheet with live previews, side-panel editing, and portable art-aware bundles.";
  const saveStatusLabel = getSaveStatusLabel(saveStatus);
  const saveStatusTone = getSaveStatusTone(saveStatus);

  return (
    <>
      <div className="app-shell">
        <CharacterLibrary
          currentCharacterId={currentCharacter?.id ?? null}
          currentCharacterName={currentCharacter?.metadata.name ?? null}
          loading={loading || isPending}
          onCreate={() => setCreateDialogOpen(true)}
          onDelete={() => {
            void deleteCurrentCharacter();
          }}
          onDuplicate={() => {
            void duplicateCurrentCharacter();
          }}
          onExport={() => {
            void exportCurrentCharacter();
          }}
          onImport={() => {
            void importCharacter();
          }}
          onSearchChange={setSearch}
          onSelect={(id) => {
            startTransition(() => {
              startUiTransition(() => {
                void openCharacter(id);
              });
            });
          }}
          saveStatus={saveStatus}
          search={search}
          summaries={filteredSummaries}
        />

        <div className="workspace-shell">
          <div className="workspace-toolbar">
            <div className="workspace-heading">
              <span className="library-kicker">Wyrdsheet</span>
              <h2>{currentCharacter?.metadata.name ?? "Parchment Workspace"}</h2>
              <span className="workspace-subtitle">{headline}</span>
            </div>

            <div className="workspace-actions">
              <div className="workspace-feedback">
                <span className={`status-pill status-pill-${saveStatusTone}`} role="status">
                  {saveStatusLabel}
                </span>
                {error ? (
                  <p className="workspace-error" role="alert">
                    {error}
                  </p>
                ) : null}
                {notice ? <p className="workspace-notice">{notice}</p> : null}
              </div>
              <button
                className="action-button"
                onClick={() => {
                  void saveCurrentCharacter();
                }}
                disabled={!currentCharacter}
                type="button"
              >
                Save now
              </button>
              <button
                className="action-button primary"
                onClick={() => setCreateDialogOpen(true)}
                type="button"
              >
                New sheet
              </button>
            </div>
          </div>

          {currentCharacter ? (
            <>
              <div className="page-nav">
                <button
                  className={activePage === "core" ? "active" : undefined}
                  onClick={() => setActivePage("core")}
                  type="button"
                >
                  Core sheet
                </button>
                <button
                  className={activePage === "features" ? "active" : undefined}
                  onClick={() => setActivePage("features")}
                  type="button"
                >
                  Features & gear
                </button>
                <button
                  className={activePage === "spells" ? "active" : undefined}
                  onClick={() => setActivePage("spells")}
                  type="button"
                >
                  Spellcasting
                </button>
              </div>

              <div className="workspace-layout">
                <SheetWorkspace
                  activePage={activePage}
                  assetDataUrls={assetDataUrls}
                  character={currentCharacter}
                  onMutate={updateCurrentCharacter}
                  onSelectRegion={setSelectedRegion}
                  selectedRegion={selectedRegion}
                />

                <InspectorPanel
                  assetDataUrls={assetDataUrls}
                  character={currentCharacter}
                  onAttachArt={(slot) => {
                    void attachArt(slot);
                  }}
                  onMutate={updateCurrentCharacter}
                  onRemoveArt={(slot) => {
                    void removeArt(slot);
                  }}
                  region={selectedRegion}
                />
              </div>
            </>
          ) : (
            <div className="workspace-layout">
              <div className="sheet-stage">
                <div className="empty-state">
                  <div>
                    <span className="library-kicker">Begin a character</span>
                    <h2>Open an existing sheet or create a new hero.</h2>
                    <p>
                      The workspace will render a three-page parchment packet with a live
                      sheet preview, art panels, and inspector-driven editing.
                    </p>
                    <button
                      className="action-button primary"
                      onClick={() => setCreateDialogOpen(true)}
                      type="button"
                    >
                      Create your first sheet
                    </button>
                  </div>
                </div>
              </div>

              <div className="inspector-panel">
                <button className="drawer-handle" type="button">
                  Inspector
                </button>
                <div className="inspector-empty">
                  <div>
                    <span className="library-kicker">Inspector</span>
                    <h2 className="inspector-title">Select a sheet section</h2>
                    <p className="inspector-copy">
                      Once you open a character, the right panel becomes the active editor
                      for whichever part of the sheet you click.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <CreateCharacterDialog
        onClose={() => setCreateDialogOpen(false)}
        onCreate={async (values) => {
          await createCharacter(values);
          setCreateDialogOpen(false);
        }}
        open={createDialogOpen}
      />
    </>
  );
}

export default App;
