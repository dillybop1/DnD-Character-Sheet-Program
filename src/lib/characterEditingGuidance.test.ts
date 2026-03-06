import { describe, expect, it } from "vitest";
import { createBlankCharacter } from "./character";
import { getRegionGuidance } from "./characterEditingGuidance";

function createCharacter() {
  return createBlankCharacter({
    name: "Iris Vale",
    playerName: "Dylan",
    className: "",
    species: "",
    background: "",
    level: 1,
  });
}

describe("character editing guidance", () => {
  it("treats the default adventurer class as incomplete identity setup", () => {
    const character = createCharacter();
    const guidance = getRegionGuidance(character, "identity");

    expect(guidance?.items.find((item) => item.label === "Class")?.state).toBe("required");
    expect(guidance?.summary).toContain("checklist");
  });

  it("flags combat values that are internally inconsistent", () => {
    const character = createCharacter();
    character.sheet.hitPoints.current = 12;
    character.sheet.hitPoints.max = 8;
    character.sheet.hitPoints.hitDice = "";

    const guidance = getRegionGuidance(character, "combat");

    expect(guidance?.issues).toContain("Current HP is higher than max HP.");
    expect(guidance?.issues).toContain("Hit dice is blank.");
  });

  it("detects blank and duplicate spell entries for spellcasters", () => {
    const character = createCharacter();
    character.build.className = "Wizard";
    character.sheet.spellcasting.spellbook = [
      { id: "1", name: "Magic Missile", level: 1, prepared: true, notes: "" },
      { id: "2", name: "Magic Missile", level: 1, prepared: false, notes: "" },
      { id: "3", name: "", level: 0, prepared: false, notes: "" },
    ];
    character.sheet.spellcasting.slots[0].current = 2;
    character.sheet.spellcasting.slots[0].max = 1;

    const guidance = getRegionGuidance(character, "spellcasting");

    expect(guidance?.issues).toContain(
      "1 spell slot row has current slots above max.",
    );
    expect(guidance?.issues).toContain("1 spell entry has no name.");
    expect(guidance?.issues).toContain("The spellbook has duplicate spell names.");
  });
});
