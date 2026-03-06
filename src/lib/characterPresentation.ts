import {
  characterSummarySchema,
  type CharacterFileV1,
  type CharacterSummary,
} from "./character";

const SUMMARY_SEPARATOR = " - ";

export function compareCharacterSummaries(
  left: CharacterSummary,
  right: CharacterSummary,
): number {
  return new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime();
}

export function sortCharacterSummaries(
  summaries: CharacterSummary[],
): CharacterSummary[] {
  return [...summaries].sort(compareCharacterSummaries);
}

export function summarizeCharacterHeadline(
  character: CharacterFileV1,
): string {
  const parts = [
    `Level ${character.build.level}`,
    character.build.className || "Adventurer",
    character.build.species || "",
  ].filter(Boolean);

  return parts.join(SUMMARY_SEPARATOR);
}

export function summarizeCharacterSubtitle(
  character: CharacterFileV1,
): string {
  if (character.metadata.playerName) {
    return `Player: ${character.metadata.playerName}`;
  }

  if (character.metadata.campaign) {
    return `Campaign: ${character.metadata.campaign}`;
  }

  return character.ruleset;
}

export function characterToSummary(
  character: CharacterFileV1,
): CharacterSummary {
  return characterSummarySchema.parse({
    id: character.id,
    name: character.metadata.name,
    classSummary: summarizeCharacterHeadline(character),
    subtitle: summarizeCharacterSubtitle(character),
    updatedAt: character.metadata.updatedAt,
    hasPortrait: character.art.some((asset) => asset.slot === "portrait"),
    themeId: character.theme.id,
  });
}

export function patchSummaryFromCharacter(
  summary: CharacterSummary,
  character: CharacterFileV1,
): CharacterSummary {
  return {
    ...summary,
    ...characterToSummary(character),
  };
}

export function upsertCharacterSummary(
  summaries: CharacterSummary[],
  summary: CharacterSummary,
): CharacterSummary[] {
  return sortCharacterSummaries([
    summary,
    ...summaries.filter((entry) => entry.id !== summary.id),
  ]);
}

export function createExportBundleName(characterName: string): string {
  return (
    characterName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "character"
  );
}
