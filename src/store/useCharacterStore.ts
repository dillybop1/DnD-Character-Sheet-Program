import { create } from "zustand";
import {
  compareSummaries,
  createBlankCharacter,
  createCharacterInputSchema,
  regionOrderByPage,
  type ArtSlot,
  type CharacterFileV1,
  type CharacterSummary,
  type CreateCharacterInput,
  type SheetPage,
  type SheetRegion,
  updateTimestamp,
  validateCharacter,
} from "../lib/character";
import * as api from "../lib/tauri";

type SaveStatus = "idle" | "loading" | "dirty" | "saving" | "saved" | "error";

type CharacterStore = {
  summaries: CharacterSummary[];
  currentCharacter: CharacterFileV1 | null;
  assetDataUrls: Record<string, string>;
  activePage: SheetPage;
  selectedRegion: SheetRegion;
  search: string;
  saveStatus: SaveStatus;
  error: string | null;
  loading: boolean;
  dirty: boolean;
  hydrate: () => Promise<void>;
  setSearch: (value: string) => void;
  setActivePage: (page: SheetPage) => void;
  setSelectedRegion: (region: SheetRegion) => void;
  createCharacter: (input: CreateCharacterInput) => Promise<void>;
  openCharacter: (id: string) => Promise<void>;
  updateCurrentCharacter: (mutator: (draft: CharacterFileV1) => void) => void;
  saveCurrentCharacter: () => Promise<void>;
  deleteCurrentCharacter: () => Promise<void>;
  duplicateCurrentCharacter: () => Promise<void>;
  importCharacter: () => Promise<void>;
  exportCurrentCharacter: () => Promise<void>;
  attachArt: (slot: ArtSlot) => Promise<void>;
  removeArt: (slot: ArtSlot) => Promise<void>;
};

function sortSummaries(summaries: CharacterSummary[]) {
  return [...summaries].sort(compareSummaries);
}

function defaultRegionForPage(page: SheetPage): SheetRegion {
  return regionOrderByPage[page][0];
}

async function refreshAssets(character: CharacterFileV1) {
  const results = await Promise.all(
    character.art.map(async (asset) => {
      try {
        return {
          id: asset.id,
          dataUrl: await api.loadArtAsset(character.id, asset.id, asset.mimeType),
        };
      } catch {
        return null;
      }
    }),
  );

  return Object.fromEntries(
    results.filter(Boolean).map((asset) => [asset!.id, asset!.dataUrl]),
  );
}

export const useCharacterStore = create<CharacterStore>((set, get) => ({
  summaries: [],
  currentCharacter: null,
  assetDataUrls: {},
  activePage: "core",
  selectedRegion: "identity",
  search: "",
  saveStatus: "idle",
  error: null,
  loading: false,
  dirty: false,
  hydrate: async () => {
    set({ loading: true, error: null, saveStatus: "loading" });

    try {
      const summaries = sortSummaries(await api.listCharacters());
      set({
        summaries,
        loading: false,
        saveStatus: "idle",
      });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Failed to load character library.",
        loading: false,
        saveStatus: "error",
      });
    }
  },
  setSearch: (value) => {
    set({ search: value });
  },
  setActivePage: (page) => {
    set({
      activePage: page,
      selectedRegion: defaultRegionForPage(page),
    });
  },
  setSelectedRegion: (region) => {
    set({ selectedRegion: region });
  },
  createCharacter: async (input) => {
    const values = createCharacterInputSchema.parse(input);
    const character = createBlankCharacter(values);
    set({ loading: true, error: null });

    try {
      const summary = await api.saveCharacter(character);
      set((state) => ({
        summaries: sortSummaries([summary, ...state.summaries.filter((entry) => entry.id !== summary.id)]),
      }));
      await get().openCharacter(character.id);
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Failed to create character.",
        loading: false,
        saveStatus: "error",
      });
    }
  },
  openCharacter: async (id) => {
    set({ loading: true, error: null });

    try {
      const loaded = validateCharacter(await api.loadCharacter(id));
      const assetDataUrls = await refreshAssets(loaded);
      set({
        currentCharacter: loaded,
        assetDataUrls,
        activePage: "core",
        selectedRegion: "identity",
        loading: false,
        dirty: false,
        saveStatus: "saved",
      });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Failed to open character.",
        loading: false,
        saveStatus: "error",
      });
    }
  },
  updateCurrentCharacter: (mutator) => {
    const current = get().currentCharacter;

    if (!current) {
      return;
    }

    const draft = structuredClone(current);
    mutator(draft);
    const next = updateTimestamp(draft);

    set((state) => ({
      currentCharacter: next,
      dirty: true,
      saveStatus: "dirty",
      summaries: sortSummaries(
        state.summaries.map((summary) =>
          summary.id === next.id
            ? {
                ...summary,
                name: next.metadata.name,
                classSummary: `${`Level ${next.build.level}`} • ${next.build.className || "Adventurer"}${next.build.species ? ` • ${next.build.species}` : ""}`,
                subtitle: next.metadata.playerName
                  ? `Player: ${next.metadata.playerName}`
                  : next.metadata.campaign
                    ? `Campaign: ${next.metadata.campaign}`
                    : next.ruleset,
                updatedAt: next.metadata.updatedAt,
                hasPortrait: next.art.some((asset) => asset.slot === "portrait"),
                themeId: next.theme.id,
              }
            : summary,
        ),
      ),
    }));
  },
  saveCurrentCharacter: async () => {
    const current = get().currentCharacter;

    if (!current) {
      return;
    }

    set({ saveStatus: "saving", error: null });

    try {
      const summary = await api.saveCharacter(validateCharacter(current));
      set((state) => ({
        summaries: sortSummaries(
          [summary, ...state.summaries.filter((entry) => entry.id !== summary.id)],
        ),
        dirty: false,
        saveStatus: "saved",
      }));
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Failed to save character.",
        saveStatus: "error",
      });
    }
  },
  deleteCurrentCharacter: async () => {
    const current = get().currentCharacter;

    if (!current) {
      return;
    }

    set({ loading: true, error: null });

    try {
      await api.deleteCharacter(current.id);
      set((state) => ({
        summaries: state.summaries.filter((summary) => summary.id !== current.id),
        currentCharacter: null,
        assetDataUrls: {},
        loading: false,
        dirty: false,
        saveStatus: "idle",
      }));
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Failed to delete character.",
        loading: false,
        saveStatus: "error",
      });
    }
  },
  duplicateCurrentCharacter: async () => {
    const current = get().currentCharacter;

    if (!current) {
      return;
    }

    set({ loading: true, error: null });

    try {
      const duplicate = await api.duplicateCharacter(current.id);
      set((state) => ({
        summaries: sortSummaries([duplicate, ...state.summaries.filter((entry) => entry.id !== duplicate.id)]),
      }));
      await get().openCharacter(duplicate.id);
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Failed to duplicate character.",
        loading: false,
        saveStatus: "error",
      });
    }
  },
  importCharacter: async () => {
    const bundlePath = await api.chooseImportBundle();

    if (!bundlePath) {
      return;
    }

    set({ loading: true, error: null });

    try {
      const imported = await api.importCharacterBundle(bundlePath);
      set((state) => ({
        summaries: sortSummaries([imported, ...state.summaries.filter((entry) => entry.id !== imported.id)]),
      }));
      await get().openCharacter(imported.id);
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Failed to import bundle.",
        loading: false,
        saveStatus: "error",
      });
    }
  },
  exportCurrentCharacter: async () => {
    const current = get().currentCharacter;

    if (!current) {
      return;
    }

    const safeName = current.metadata.name.toLowerCase().replace(/[^a-z0-9]+/g, "-") || "character";
    const destinationPath = await api.chooseExportBundle(safeName);

    if (!destinationPath) {
      return;
    }

    try {
      await api.exportCharacterBundle(current.id, destinationPath);
      set({ error: null });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Failed to export bundle.",
        saveStatus: "error",
      });
    }
  },
  attachArt: async (slot) => {
    const current = get().currentCharacter;

    if (!current) {
      return;
    }

    const sourcePath = await api.chooseArtAsset();

    if (!sourcePath) {
      return;
    }

    try {
      const existing = current.art.find((entry) => entry.slot === slot);
      if (existing) {
        await api.removeArtAsset(current.id, existing.id);
      }
      const asset = await api.attachArtAsset(current.id, sourcePath, slot);
      const dataUrl = await api.loadArtAsset(current.id, asset.id, asset.mimeType);
      get().updateCurrentCharacter((draft) => {
        draft.art = draft.art.filter((entry) => entry.slot !== slot);
        draft.art.push(asset);
      });
      set((state) => ({
        assetDataUrls: {
          ...state.assetDataUrls,
          [asset.id]: dataUrl,
        },
      }));
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Failed to attach art asset.",
        saveStatus: "error",
      });
    }
  },
  removeArt: async (slot) => {
    const current = get().currentCharacter;

    if (!current) {
      return;
    }

    const asset = current.art.find((entry) => entry.slot === slot);

    if (!asset) {
      return;
    }

    try {
      await api.removeArtAsset(current.id, asset.id);
      get().updateCurrentCharacter((draft) => {
        draft.art = draft.art.filter((entry) => entry.id !== asset.id);
      });
      set((state) => {
        const next = { ...state.assetDataUrls };
        delete next[asset.id];
        return { assetDataUrls: next };
      });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Failed to remove art asset.",
        saveStatus: "error",
      });
    }
  },
}));
