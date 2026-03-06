import { beforeEach, describe, expect, it, vi } from "vitest";
import { createBlankCharacter } from "./character";

const tauriMocks = vi.hoisted(() => ({
  attachArtAsset: vi.fn(),
  exportCharacterBundle: vi.fn(),
  importCharacterBundle: vi.fn(),
  loadArtAsset: vi.fn(),
  loadCharacter: vi.fn(),
  removeArtAsset: vi.fn(),
}));

vi.mock("./tauri", () => tauriMocks);

import {
  attachArtToCharacter,
  exportCharacterRecord,
  importCharacterRecord,
  loadCharacterRecord,
  removeArtFromCharacter,
} from "./characterRepository";

function createCharacter() {
  return createBlankCharacter({
    name: "Iris Vale",
    className: "Cleric",
    species: "Human",
    background: "Acolyte",
    playerName: "Dylan",
    level: 3,
  });
}

describe("character repository", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("loads a character and available art assets", async () => {
    const character = createCharacter();
    character.art = [
      {
        id: "portrait-1",
        slot: "portrait",
        fileName: "portrait.png",
        mimeType: "image/png",
      },
      {
        id: "feature-1",
        slot: "featureArt",
        fileName: "feature.png",
        mimeType: "image/png",
      },
    ];

    tauriMocks.loadCharacter.mockResolvedValue({
      document: character,
      recoveredFromBackup: false,
    });
    tauriMocks.loadArtAsset.mockImplementation(
      async (_characterId: string, assetId: string) => {
        if (assetId === "feature-1") {
          throw new Error("missing asset");
        }

        return "data:image/png;base64,portrait";
      },
    );

    await expect(loadCharacterRecord(character.id)).resolves.toEqual({
      character,
      assetDataUrls: {
        "portrait-1": "data:image/png;base64,portrait",
      },
      recoveryNotice:
        "1 art file could not be loaded. That panel will stay empty until you replace the art.",
    });
  });

  it("imports a bundle and loads the imported character record", async () => {
    const character = createCharacter();
    const summary = {
      id: character.id,
      name: character.metadata.name,
      classSummary: "Level 3 - Cleric - Human",
      subtitle: "Player: Dylan",
      updatedAt: character.metadata.updatedAt,
      hasPortrait: false,
      themeId: "clean-parchment-v1",
    };

    tauriMocks.importCharacterBundle.mockResolvedValue(summary);
    tauriMocks.loadCharacter.mockResolvedValue({
      document: character,
      recoveredFromBackup: false,
    });
    tauriMocks.loadArtAsset.mockResolvedValue("data:image/png;base64,portrait");

    await expect(importCharacterRecord("A:/Imports/iris.dcsheet")).resolves.toEqual({
      summary,
      character,
      assetDataUrls: {},
      recoveryNotice: null,
    });
  });

  it("surfaces a recovery notice when the backend loads from backup", async () => {
    const character = createCharacter();

    tauriMocks.loadCharacter.mockResolvedValue({
      document: character,
      recoveredFromBackup: true,
    });

    await expect(loadCharacterRecord(character.id)).resolves.toEqual({
      character,
      assetDataUrls: {},
      recoveryNotice:
        "Recovered this sheet from its backup because the main character file could not be read.",
    });
  });

  it("exports a character bundle to the selected destination", async () => {
    tauriMocks.exportCharacterBundle.mockResolvedValue(undefined);

    await expect(
      exportCharacterRecord("hero-1", "A:/Exports/hero.dcsheet"),
    ).resolves.toBeUndefined();

    expect(tauriMocks.exportCharacterBundle).toHaveBeenCalledWith(
      "hero-1",
      "A:/Exports/hero.dcsheet",
    );
  });

  it("replaces existing art in a slot before attaching new art", async () => {
    const character = createCharacter();
    character.art = [
      {
        id: "portrait-1",
        slot: "portrait",
        fileName: "portrait.png",
        mimeType: "image/png",
      },
    ];

    tauriMocks.attachArtAsset.mockResolvedValue({
      id: "portrait-2",
      slot: "portrait",
      fileName: "new-portrait.png",
      mimeType: "image/png",
    });
    tauriMocks.loadArtAsset.mockResolvedValue("data:image/png;base64,new");

    await expect(
      attachArtToCharacter(character, "A:/Art/new-portrait.png", "portrait"),
    ).resolves.toEqual({
      asset: {
        id: "portrait-2",
        slot: "portrait",
        fileName: "new-portrait.png",
        mimeType: "image/png",
      },
      dataUrl: "data:image/png;base64,new",
      replacedAssetId: "portrait-1",
    });

    expect(tauriMocks.removeArtAsset).toHaveBeenCalledWith(character.id, "portrait-1");
  });

  it("removes art for a slot when present and skips when absent", async () => {
    const character = createCharacter();
    character.art = [
      {
        id: "spell-1",
        slot: "spellArt",
        fileName: "spell.png",
        mimeType: "image/png",
      },
    ];

    await expect(removeArtFromCharacter(character, "spellArt")).resolves.toEqual({
      removedAssetId: "spell-1",
    });
    await expect(removeArtFromCharacter(character, "portrait")).resolves.toBeNull();
    expect(tauriMocks.removeArtAsset).toHaveBeenCalledTimes(1);
  });
});
