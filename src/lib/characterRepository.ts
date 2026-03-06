import {
  type ArtAssetRef,
  type ArtSlot,
  type CharacterFileV1,
  type CharacterSummary,
  validateCharacter,
} from "./character";
import * as api from "./tauri";

export type LoadedCharacterRecord = {
  character: CharacterFileV1;
  assetDataUrls: Record<string, string>;
};

export type ImportedCharacterRecord = LoadedCharacterRecord & {
  summary: CharacterSummary;
};

export type AttachedArtRecord = {
  asset: ArtAssetRef;
  dataUrl: string;
  replacedAssetId: string | null;
};

export type RemovedArtRecord = {
  removedAssetId: string;
};

async function loadCharacterAssets(
  character: CharacterFileV1,
): Promise<Record<string, string>> {
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

export async function loadCharacterRecord(
  id: string,
): Promise<LoadedCharacterRecord> {
  const character = validateCharacter(await api.loadCharacter(id));
  const assetDataUrls = await loadCharacterAssets(character);

  return { character, assetDataUrls };
}

export async function importCharacterRecord(
  bundlePath: string,
): Promise<ImportedCharacterRecord> {
  const summary = await api.importCharacterBundle(bundlePath);
  const loaded = await loadCharacterRecord(summary.id);

  return {
    summary,
    ...loaded,
  };
}

export async function exportCharacterRecord(
  characterId: string,
  destinationPath: string,
): Promise<void> {
  await api.exportCharacterBundle(characterId, destinationPath);
}

export async function attachArtToCharacter(
  character: CharacterFileV1,
  sourcePath: string,
  slot: ArtSlot,
): Promise<AttachedArtRecord> {
  const existing = character.art.find((entry) => entry.slot === slot);

  if (existing) {
    await api.removeArtAsset(character.id, existing.id);
  }

  const asset = await api.attachArtAsset(character.id, sourcePath, slot);
  const dataUrl = await api.loadArtAsset(character.id, asset.id, asset.mimeType);

  return {
    asset,
    dataUrl,
    replacedAssetId: existing?.id ?? null,
  };
}

export async function removeArtFromCharacter(
  character: CharacterFileV1,
  slot: ArtSlot,
): Promise<RemovedArtRecord | null> {
  const asset = character.art.find((entry) => entry.slot === slot);

  if (!asset) {
    return null;
  }

  await api.removeArtAsset(character.id, asset.id);

  return {
    removedAssetId: asset.id,
  };
}
