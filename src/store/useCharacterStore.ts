import { create } from "zustand";
import {
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
import {
  characterToSummary,
  createExportBundleName,
  patchSummaryFromCharacter,
  sortCharacterSummaries,
  upsertCharacterSummary,
} from "../lib/characterPresentation";
import {
  attachArtToCharacter,
  exportCharacterRecord,
  importCharacterRecord,
  loadCharacterRecord,
  removeArtFromCharacter,
} from "../lib/characterRepository";
import { formatCommandError, type SaveStatus } from "../lib/statusFeedback";
import * as api from "../lib/tauri";

type CharacterStore = {
  summaries: CharacterSummary[];
  currentCharacter: CharacterFileV1 | null;
  assetDataUrls: Record<string, string>;
  activePage: SheetPage;
  selectedRegion: SheetRegion;
  search: string;
  saveStatus: SaveStatus;
  error: string | null;
  notice: string | null;
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

function defaultRegionForPage(page: SheetPage): SheetRegion {
  return regionOrderByPage[page][0];
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
  notice: null,
  loading: false,
  dirty: false,
  hydrate: async () => {
    set({ loading: true, error: null, notice: null, saveStatus: "loading" });

    try {
      const summaries = sortCharacterSummaries(await api.listCharacters());
      set({
        summaries,
        loading: false,
        saveStatus: "idle",
      });
    } catch (error) {
      set({
        error: formatCommandError("loadLibrary", error),
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
    set({ loading: true, error: null, notice: null });

    try {
      const summary = await api.saveCharacter(character);
      set((state) => ({
        summaries: upsertCharacterSummary(state.summaries, summary),
      }));
      await get().openCharacter(character.id);
    } catch (error) {
      set({
        error: formatCommandError("createCharacter", error),
        loading: false,
        saveStatus: "error",
      });
    }
  },
  openCharacter: async (id) => {
    set({ loading: true, error: null, notice: null });

    try {
      const { character, assetDataUrls, recoveryNotice } = await loadCharacterRecord(id);
      set({
        currentCharacter: character,
        assetDataUrls,
        activePage: "core",
        selectedRegion: "identity",
        loading: false,
        dirty: false,
        notice: recoveryNotice,
        saveStatus: "saved",
      });
    } catch (error) {
      set({
        error: formatCommandError("openCharacter", error),
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

    set((state) => {
      const existingSummary = state.summaries.find((summary) => summary.id === next.id);

      return {
        currentCharacter: next,
        dirty: true,
        saveStatus: "dirty",
        summaries: upsertCharacterSummary(
          state.summaries,
          existingSummary
            ? patchSummaryFromCharacter(existingSummary, next)
            : characterToSummary(next),
        ),
      };
    });
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
        summaries: upsertCharacterSummary(state.summaries, summary),
        dirty: false,
        saveStatus: "saved",
      }));
    } catch (error) {
      set({
        error: formatCommandError("saveCharacter", error),
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
        notice: null,
        saveStatus: "idle",
      }));
    } catch (error) {
      set({
        error: formatCommandError("deleteCharacter", error),
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

    set({ loading: true, error: null, notice: null });

    try {
      const duplicate = await api.duplicateCharacter(current.id);
      set((state) => ({
        summaries: upsertCharacterSummary(state.summaries, duplicate),
      }));
      await get().openCharacter(duplicate.id);
    } catch (error) {
      set({
        error: formatCommandError("duplicateCharacter", error),
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

    set({ loading: true, error: null, notice: null });

    try {
      const imported = await importCharacterRecord(bundlePath);
      set((state) => ({
        summaries: upsertCharacterSummary(state.summaries, imported.summary),
        currentCharacter: imported.character,
        assetDataUrls: imported.assetDataUrls,
        activePage: "core",
        selectedRegion: "identity",
        loading: false,
        dirty: false,
        notice: imported.recoveryNotice,
        saveStatus: "saved",
      }));
    } catch (error) {
      set({
        error: formatCommandError("importBundle", error),
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

    const safeName = createExportBundleName(current.metadata.name);
    const destinationPath = await api.chooseExportBundle(safeName);

    if (!destinationPath) {
      return;
    }

    try {
      await exportCharacterRecord(current.id, destinationPath);
      set({ error: null });
    } catch (error) {
      set({
        error: formatCommandError("exportBundle", error),
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
      const { asset, dataUrl, replacedAssetId } = await attachArtToCharacter(
        current,
        sourcePath,
        slot,
      );

      get().updateCurrentCharacter((draft) => {
        draft.art = draft.art.filter((entry) => entry.slot !== slot);
        draft.art.push(asset);
      });
      set((state) => {
        const next = { ...state.assetDataUrls };

        if (replacedAssetId) {
          delete next[replacedAssetId];
        }

        next[asset.id] = dataUrl;

        return { assetDataUrls: next };
      });
    } catch (error) {
      set({
        error: formatCommandError("attachArt", error),
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
      const removed = await removeArtFromCharacter(current, slot);

      if (!removed) {
        return;
      }

      get().updateCurrentCharacter((draft) => {
        draft.art = draft.art.filter((entry) => entry.id !== removed.removedAssetId);
      });
      set((state) => {
        const next = { ...state.assetDataUrls };
        delete next[removed.removedAssetId];
        return { assetDataUrls: next };
      });
    } catch (error) {
      set({
        error: formatCommandError("removeArt", error),
        saveStatus: "error",
      });
    }
  },
}));
