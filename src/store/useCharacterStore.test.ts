import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  createBlankCharacter,
  type CharacterFileV1,
  type CharacterSummary,
} from "../lib/character";
import { characterToSummary } from "../lib/characterPresentation";

const apiMocks = vi.hoisted(() => ({
  chooseArtAsset: vi.fn(),
  chooseExportBundle: vi.fn(),
  chooseImportBundle: vi.fn(),
  deleteCharacter: vi.fn(),
  duplicateCharacter: vi.fn(),
  listCharacters: vi.fn(),
  saveCharacter: vi.fn(),
}));

const repositoryMocks = vi.hoisted(() => ({
  attachArtToCharacter: vi.fn(),
  exportCharacterRecord: vi.fn(),
  importCharacterRecord: vi.fn(),
  loadCharacterRecord: vi.fn(),
  removeArtFromCharacter: vi.fn(),
}));

vi.mock("../lib/tauri", () => apiMocks);
vi.mock("../lib/characterRepository", () => repositoryMocks);

import { useCharacterStore } from "./useCharacterStore";

function buildCharacter(overrides?: Partial<CharacterFileV1>): CharacterFileV1 {
  const character = createBlankCharacter({
    name: "Iris Vale",
    className: "Cleric",
    species: "Human",
    background: "Acolyte",
    playerName: "Dylan",
    level: 3,
  });

  return {
    ...character,
    ...overrides,
    metadata: {
      ...character.metadata,
      ...overrides?.metadata,
    },
    build: {
      ...character.build,
      ...overrides?.build,
    },
    sheet: {
      ...character.sheet,
      ...overrides?.sheet,
    },
    theme: {
      ...character.theme,
      ...overrides?.theme,
    },
    art: overrides?.art ?? character.art,
    customSections: overrides?.customSections ?? character.customSections,
  };
}

function resetStore() {
  useCharacterStore.setState({
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
  });
}

describe("useCharacterStore", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetStore();
  });

  it("hydrates and sorts the character library", async () => {
    const older: CharacterSummary = {
      id: "older",
      name: "Older",
      classSummary: "Level 1 - Fighter",
      subtitle: "Player: Rowan",
      updatedAt: "2026-03-05T09:00:00.000Z",
      hasPortrait: false,
      themeId: "clean-parchment-v1",
    };
    const newer: CharacterSummary = {
      id: "newer",
      name: "Newer",
      classSummary: "Level 2 - Wizard",
      subtitle: "Campaign: Dawn March",
      updatedAt: "2026-03-06T09:00:00.000Z",
      hasPortrait: true,
      themeId: "clean-parchment-v1",
    };

    apiMocks.listCharacters.mockResolvedValue([older, newer]);

    await useCharacterStore.getState().hydrate();

    expect(useCharacterStore.getState().summaries.map((summary) => summary.id)).toEqual([
      "newer",
      "older",
    ]);
    expect(useCharacterStore.getState().saveStatus).toBe("idle");
    expect(useCharacterStore.getState().loading).toBe(false);
  });

  it("creates a character, stores its summary, and opens it", async () => {
    let createdCharacterId = "";
    apiMocks.saveCharacter.mockImplementation(async (character: CharacterFileV1) => {
      createdCharacterId = character.id;
      return characterToSummary(character);
    });
    repositoryMocks.loadCharacterRecord.mockImplementation(async (id: string) => ({
      character: buildCharacter({ id }),
      assetDataUrls: {},
    }));

    await useCharacterStore.getState().createCharacter({
      name: "Iris Vale",
      className: "Cleric",
      species: "Human",
      background: "Acolyte",
      playerName: "Dylan",
      level: 3,
    });

    expect(apiMocks.saveCharacter).toHaveBeenCalledTimes(1);
    expect(repositoryMocks.loadCharacterRecord).toHaveBeenCalledWith(createdCharacterId);
    expect(useCharacterStore.getState().currentCharacter?.id).toBe(createdCharacterId);
    expect(useCharacterStore.getState().summaries[0].id).toBe(createdCharacterId);
    expect(useCharacterStore.getState().saveStatus).toBe("saved");
  });

  it("opens a character and resets view state to the default page", async () => {
    const character = buildCharacter({ id: "hero-2" });

    useCharacterStore.setState({
      activePage: "spells",
      selectedRegion: "spellcasting",
    });

    repositoryMocks.loadCharacterRecord.mockResolvedValue({
      character,
      assetDataUrls: {
        "portrait-1": "data:image/png;base64,portrait",
      },
    });

    await useCharacterStore.getState().openCharacter(character.id);

    expect(useCharacterStore.getState().currentCharacter).toEqual(character);
    expect(useCharacterStore.getState().assetDataUrls).toEqual({
      "portrait-1": "data:image/png;base64,portrait",
    });
    expect(useCharacterStore.getState().activePage).toBe("core");
    expect(useCharacterStore.getState().selectedRegion).toBe("identity");
  });

  it("saves the current character and clears the dirty state", async () => {
    const character = buildCharacter({ id: "hero-3" });
    const summary = characterToSummary(character);

    useCharacterStore.setState({
      currentCharacter: character,
      summaries: [summary],
      dirty: true,
      saveStatus: "dirty",
    });
    apiMocks.saveCharacter.mockResolvedValue(summary);

    await useCharacterStore.getState().saveCurrentCharacter();

    expect(apiMocks.saveCharacter).toHaveBeenCalledWith(character);
    expect(useCharacterStore.getState().dirty).toBe(false);
    expect(useCharacterStore.getState().saveStatus).toBe("saved");
    expect(useCharacterStore.getState().summaries[0]).toEqual(summary);
  });

  it("deletes the current character and clears selection state", async () => {
    const character = buildCharacter({ id: "hero-4" });
    const summary = characterToSummary(character);

    useCharacterStore.setState({
      summaries: [summary],
      currentCharacter: character,
      assetDataUrls: {
        "portrait-1": "data:image/png;base64,portrait",
      },
      dirty: true,
    });
    apiMocks.deleteCharacter.mockResolvedValue(undefined);

    await useCharacterStore.getState().deleteCurrentCharacter();

    expect(apiMocks.deleteCharacter).toHaveBeenCalledWith("hero-4");
    expect(useCharacterStore.getState().summaries).toEqual([]);
    expect(useCharacterStore.getState().currentCharacter).toBeNull();
    expect(useCharacterStore.getState().assetDataUrls).toEqual({});
    expect(useCharacterStore.getState().saveStatus).toBe("idle");
  });

  it("duplicates the current character and opens the duplicate", async () => {
    const current = buildCharacter({ id: "hero-5" });
    const duplicate = buildCharacter({
      id: "hero-6",
      metadata: {
        ...current.metadata,
        name: "Iris Vale Copy",
      },
    });
    const currentSummary = characterToSummary(current);
    const duplicateSummary = characterToSummary(duplicate);

    useCharacterStore.setState({
      summaries: [currentSummary],
      currentCharacter: current,
    });
    apiMocks.duplicateCharacter.mockResolvedValue(duplicateSummary);
    repositoryMocks.loadCharacterRecord.mockResolvedValue({
      character: duplicate,
      assetDataUrls: {},
    });

    await useCharacterStore.getState().duplicateCurrentCharacter();

    expect(apiMocks.duplicateCharacter).toHaveBeenCalledWith("hero-5");
    expect(repositoryMocks.loadCharacterRecord).toHaveBeenCalledWith("hero-6");
    expect(useCharacterStore.getState().currentCharacter?.id).toBe("hero-6");
    expect(useCharacterStore.getState().summaries[0]).toEqual(duplicateSummary);
  });
});
