import { describe, expect, it } from "vitest";
import {
  createCharacterDefaultValues,
  getCreateCharacterGuidance,
} from "./createCharacterGuidance";

describe("create character guidance", () => {
  it("starts with only the default level complete", () => {
    const guidance = getCreateCharacterGuidance(createCharacterDefaultValues);

    expect(guidance.readyToCreate).toBe(false);
    expect(guidance.summaryTitle).toBe("1 required step left");
    expect(guidance.completedCount).toBe(1);
    expect(guidance.items.find((item) => item.key === "name")?.state).toBe("required");
    expect(guidance.items.find((item) => item.key === "level")?.state).toBe("complete");
  });

  it("becomes ready once the required fields are complete", () => {
    const guidance = getCreateCharacterGuidance({
      ...createCharacterDefaultValues,
      name: "Iris Vale",
    });

    expect(guidance.readyToCreate).toBe(true);
    expect(guidance.summaryTitle).toBe("Ready to create");
    expect(guidance.items.find((item) => item.key === "className")?.state).toBe(
      "recommended",
    );
  });

  it("marks the starter checklist complete when recommended fields are filled in", () => {
    const guidance = getCreateCharacterGuidance({
      ...createCharacterDefaultValues,
      name: "Iris Vale",
      className: "Cleric",
      species: "Human",
      background: "Acolyte",
    });

    expect(guidance.readyToCreate).toBe(true);
    expect(guidance.summaryTitle).toBe("Starter details complete");
    expect(guidance.completedCount).toBe(5);
  });
});
