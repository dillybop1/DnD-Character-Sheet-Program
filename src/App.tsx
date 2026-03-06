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

type AppView = "roster" | "workspace";

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
  const [currentView, setCurrentView] = useState<AppView>("roster");
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
  const isRosterView = currentView === "roster" || !currentCharacter;

  async function openWorkspaceAfter(action: () => Promise<void>) {
    const previousCharacter = useCharacterStore.getState().currentCharacter;

    await action();

    const nextCharacter = useCharacterStore.getState().currentCharacter;
    const didOpenCharacter = Boolean(nextCharacter && nextCharacter !== previousCharacter);

    if (didOpenCharacter) {
      setCurrentView("workspace");
    }

    return didOpenCharacter;
  }

  if (isRosterView) {
    return (
      <>
        <div className="app-shell app-shell-roster">
          <CharacterLibrary
            currentCharacterId={currentCharacter?.id ?? null}
            currentCharacterName={currentCharacter?.metadata.name ?? null}
            loading={loading || isPending}
            onCreate={() => setCreateDialogOpen(true)}
            onDelete={() => {
              void deleteCurrentCharacter();
            }}
            onDuplicate={() => {
              void openWorkspaceAfter(() => duplicateCurrentCharacter());
            }}
            onExport={() => {
              void exportCurrentCharacter();
            }}
            onImport={() => {
              void openWorkspaceAfter(() => importCharacter());
            }}
            onSearchChange={setSearch}
            onSelect={(id) => {
              startTransition(() => {
                startUiTransition(() => {
                  void openWorkspaceAfter(() => openCharacter(id));
                });
              });
            }}
            saveStatus={saveStatus}
            search={search}
            summaries={filteredSummaries}
            variant="screen"
          />
        </div>

        <CreateCharacterDialog
          onClose={() => setCreateDialogOpen(false)}
          onCreate={async (values) => {
            const didCreateCharacter = await openWorkspaceAfter(() => createCharacter(values));

            if (didCreateCharacter) {
              setCreateDialogOpen(false);
            }
          }}
          open={createDialogOpen}
        />
      </>
    );
  }

  if (!currentCharacter) {
    return null;
  }

  return (
    <>
      <div className="app-shell app-shell-workspace">
        <div className="workspace-shell">
          <div className="workspace-toolbar">
            <div className="workspace-heading">
              <span className="library-kicker">Wyrdsheet</span>
              <h2>{currentCharacter.metadata.name}</h2>
              <span className="workspace-subtitle">{headline}</span>
            </div>

            <div className="workspace-actions">
              <button
                className="action-button"
                onClick={() => setCurrentView("roster")}
                type="button"
              >
                Return to roster
              </button>
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
        </div>
      </div>

      <CreateCharacterDialog
        onClose={() => setCreateDialogOpen(false)}
        onCreate={async (values) => {
          const didCreateCharacter = await openWorkspaceAfter(() => createCharacter(values));

          if (didCreateCharacter) {
            setCreateDialogOpen(false);
          }
        }}
        open={createDialogOpen}
      />
    </>
  );
}

export default App;
