import { describe, expect, it } from "vitest";
import { createBlankCharacter, type CharacterSummary } from "./character";
import {
  characterToSummary,
  createExportBundleName,
  patchSummaryFromCharacter,
  sortCharacterSummaries,
  summarizeCharacterHeadline,
  summarizeCharacterSubtitle,
  upsertCharacterSummary,
} from "./characterPresentation";

function createCharacter() {
  const character = createBlankCharacter({
    name: "Iris Vale",
    className: "Cleric",
    species: "Human",
    background: "Acolyte",
    playerName: "Dylan",
    level: 3,
  });

  character.metadata.updatedAt = "2026-03-06T12:00:00.000Z";
  return character;
}

describe("character presentation helpers", () => {
  it("builds a headline from level, class, and species", () => {
    const character = createCharacter();

    expect(summarizeCharacterHeadline(character)).toBe("Level 3 - Cleric - Human");
  });

  it("prefers player name, then campaign, then ruleset for the subtitle", () => {
    const withPlayer = createCharacter();
    const withCampaign = createCharacter();
    const withRuleset = createCharacter();

    withCampaign.metadata.playerName = "";
    withCampaign.metadata.campaign = "Icewind Dale";
    withRuleset.metadata.playerName = "";
    withRuleset.metadata.campaign = "";

    expect(summarizeCharacterSubtitle(withPlayer)).toBe("Player: Dylan");
    expect(summarizeCharacterSubtitle(withCampaign)).toBe("Campaign: Icewind Dale");
    expect(summarizeCharacterSubtitle(withRuleset)).toBe("dnd5e-2024-srd-5.2.1");
  });

  it("creates and patches character summaries from character data", () => {
    const character = createCharacter();
    const summary = characterToSummary(character);

    character.metadata.name = "Iris Storm";
    character.build.level = 4;
    character.metadata.updatedAt = "2026-03-06T13:00:00.000Z";

    expect(summary).toMatchObject({
      id: character.id,
      name: "Iris Vale",
      classSummary: "Level 3 - Cleric - Human",
      subtitle: "Player: Dylan",
      updatedAt: "2026-03-06T12:00:00.000Z",
      hasPortrait: false,
      themeId: "clean-parchment-v1",
    });

    expect(patchSummaryFromCharacter(summary, character)).toMatchObject({
      id: character.id,
      name: "Iris Storm",
      classSummary: "Level 4 - Cleric - Human",
      subtitle: "Player: Dylan",
      updatedAt: "2026-03-06T13:00:00.000Z",
      hasPortrait: false,
      themeId: "clean-parchment-v1",
    });
  });

  it("sorts and upserts summaries by most recent update", () => {
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
    const replacement: CharacterSummary = {
      ...older,
      name: "Older Revised",
      updatedAt: "2026-03-07T09:00:00.000Z",
    };

    expect(sortCharacterSummaries([older, newer]).map((summary) => summary.id)).toEqual([
      "newer",
      "older",
    ]);

    expect(upsertCharacterSummary([older, newer], replacement)).toEqual([
      replacement,
      newer,
    ]);
  });

  it("creates a safe export bundle name", () => {
    expect(createExportBundleName("Sir Rowan the 3rd!")).toBe("sir-rowan-the-3rd");
    expect(createExportBundleName("")).toBe("character");
  });
});
