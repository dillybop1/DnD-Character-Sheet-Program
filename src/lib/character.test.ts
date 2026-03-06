import { describe, expect, it } from "vitest";
import {
  createBlankCharacter,
  deriveCharacter,
  normalizeDelimitedList,
  validateCharacter,
} from "./character";

describe("character model helpers", () => {
  it("creates a valid default character document", () => {
    const character = createBlankCharacter({
      name: "Iris Vale",
      className: "Cleric",
      species: "Human",
      background: "Acolyte",
      playerName: "Dylan",
      level: 1,
    });

    expect(character.metadata.name).toBe("Iris Vale");
    expect(character.ruleset).toBe("dnd5e-2024-srd-5.2.1");
    expect(character.sheet.spellcasting.slots).toHaveLength(9);
    expect(() => validateCharacter(character)).not.toThrow();
  });

  it("derives proficiency, saves, and spell numbers from the sheet", () => {
    const character = createBlankCharacter({
      name: "Bram Cinder",
      className: "Wizard",
      species: "Elf",
      background: "Sage",
      playerName: "",
      level: 5,
    });

    character.build.abilities.intelligence = 18;
    character.build.abilities.dexterity = 14;
    character.build.skillRanks.arcana = 1;
    character.build.savingThrowProficiencies = ["intelligence", "wisdom"];
    character.sheet.spellcasting.castingAbility = "intelligence";

    const derived = deriveCharacter(character);

    expect(derived.proficiencyBonus).toBe(3);
    expect(derived.savingThrows.intelligence).toBe(7);
    expect(derived.skills.arcana).toBe(7);
    expect(derived.initiative).toBe(2);
    expect(derived.spellAttackBonus).toBe(7);
    expect(derived.spellSaveDc).toBe(15);
  });

  it("normalizes comma and newline delimited lists", () => {
    expect(normalizeDelimitedList("Common, Elvish\nDraconic")).toEqual([
      "Common",
      "Elvish",
      "Draconic",
    ]);
  });
});
