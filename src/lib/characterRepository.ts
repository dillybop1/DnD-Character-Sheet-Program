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
  recoveryNotice: string | null;
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
): Promise<{
  assetDataUrls: Record<string, string>;
  missingAssetCount: number;
}> {
  const results = await Promise.all(
    character.art.map(async (asset) => {
      try {
        return {
          id: asset.id,
          dataUrl: await api.loadArtAsset(character.id, asset.id, asset.mimeType),
          missing: false,
        };
      } catch {
        return {
          id: asset.id,
          dataUrl: null,
          missing: true,
        };
      }
    }),
  );

  return {
    assetDataUrls: Object.fromEntries(
      results
        .filter((asset): asset is { id: string; dataUrl: string; missing: boolean } =>
          Boolean(asset.dataUrl),
        )
        .map((asset) => [asset.id, asset.dataUrl]),
    ),
    missingAssetCount: results.filter((asset) => asset.missing).length,
  };
}

function formatRecoveryNotice(recoveredFromBackup: boolean, missingAssetCount: number) {
  const messages: string[] = [];

  if (recoveredFromBackup) {
    messages.push(
      "Recovered this sheet from its backup because the main character file could not be read.",
    );
  }

  if (missingAssetCount === 1) {
    messages.push(
      "1 art file could not be loaded. That panel will stay empty until you replace the art.",
    );
  } else if (missingAssetCount > 1) {
    messages.push(
      `${missingAssetCount} art files could not be loaded. Those panels will stay empty until you replace the art.`,
    );
  }

  return messages.length ? messages.join(" ") : null;
}

export async function loadCharacterRecord(
  id: string,
): Promise<LoadedCharacterRecord> {
  const loaded = await api.loadCharacter(id);
  const character = validateCharacter(loaded.document);
  const { assetDataUrls, missingAssetCount } = await loadCharacterAssets(character);

  return {
    character,
    assetDataUrls,
    recoveryNotice: formatRecoveryNotice(loaded.recoveredFromBackup, missingAssetCount),
  };
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
