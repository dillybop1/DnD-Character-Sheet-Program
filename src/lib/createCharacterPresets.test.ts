import { describe, expect, it } from "vitest";
import {
  applyCreateCharacterPreset,
  createCharacterPresets,
  findActiveCreateCharacterPreset,
} from "./createCharacterPresets";

describe("create character presets", () => {
  it("applies a preset without overwriting the name or player name", () => {
    const next = applyCreateCharacterPreset(
      {
        name: "Iris Vale",
        playerName: "Dylan",
        className: "",
        species: "",
        background: "",
        level: 1,
      },
      createCharacterPresets[0],
    );

    expect(next).toMatchObject({
      name: "Iris Vale",
      playerName: "Dylan",
      className: "Cleric",
      species: "Human",
      background: "Acolyte",
      level: 1,
    });
  });

  it("finds the active preset when the form values match", () => {
    expect(
      findActiveCreateCharacterPreset({
        className: "Wizard",
        species: "Elf",
        background: "Sage",
        level: 1,
      })?.id,
    ).toBe("wizard-sage");
  });
});
