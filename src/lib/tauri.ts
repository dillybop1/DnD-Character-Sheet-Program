import { invoke } from "@tauri-apps/api/core";
import { open, save } from "@tauri-apps/plugin-dialog";
import type {
  ArtAssetRef,
  ArtSlot,
  CharacterFileV1,
  CharacterSummary,
} from "./character";

export type LoadedCharacterDocument = {
  document: CharacterFileV1;
  recoveredFromBackup: boolean;
};

export async function listCharacters(): Promise<CharacterSummary[]> {
  return invoke("list_characters");
}

export async function loadCharacter(id: string): Promise<LoadedCharacterDocument> {
  return invoke("load_character", { id });
}

export async function saveCharacter(doc: CharacterFileV1): Promise<CharacterSummary> {
  return invoke("save_character", { doc });
}

export async function deleteCharacter(id: string): Promise<void> {
  return invoke("delete_character", { id });
}

export async function duplicateCharacter(id: string): Promise<CharacterSummary> {
  return invoke("duplicate_character", { id });
}

export async function importCharacterBundle(bundlePath: string): Promise<CharacterSummary> {
  return invoke("import_character_bundle", { bundlePath });
}

export async function exportCharacterBundle(
  characterId: string,
  destinationPath: string,
): Promise<void> {
  return invoke("export_character_bundle", { characterId, destinationPath });
}

export async function attachArtAsset(
  characterId: string,
  sourcePath: string,
  slot: ArtSlot,
): Promise<ArtAssetRef> {
  return invoke("attach_art_asset", { characterId, sourcePath, slot });
}

export async function removeArtAsset(characterId: string, assetId: string): Promise<void> {
  return invoke("remove_art_asset", { characterId, assetId });
}

export async function loadArtAsset(
  characterId: string,
  assetId: string,
  mimeType: string,
): Promise<string> {
  return invoke("load_art_asset", { characterId, assetId, mimeType });
}

export async function chooseImportBundle(): Promise<string | null> {
  const result = await open({
    filters: [{ name: "Wyrdsheet Bundle", extensions: ["dcsheet"] }],
    multiple: false,
    title: "Import Wyrdsheet bundle",
  });

  return typeof result === "string" ? result : null;
}

export async function chooseExportBundle(defaultName: string): Promise<string | null> {
  return save({
    defaultPath: `${defaultName}.dcsheet`,
    filters: [{ name: "Wyrdsheet Bundle", extensions: ["dcsheet"] }],
    title: "Export Wyrdsheet bundle",
  });
}

export async function chooseArtAsset(): Promise<string | null> {
  const result = await open({
    filters: [
      {
        name: "Image files",
        extensions: ["png", "jpg", "jpeg", "webp", "gif"],
      },
    ],
    multiple: false,
    title: "Choose art for the sheet",
  });

  return typeof result === "string" ? result : null;
}
