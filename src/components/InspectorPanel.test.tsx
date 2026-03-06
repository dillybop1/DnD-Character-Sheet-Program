import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { createBlankCharacter } from "../lib/character";
import { InspectorPanel } from "./InspectorPanel";

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

describe("InspectorPanel guidance", () => {
  it("shows region guidance and warnings for combat issues", () => {
    const character = createCharacter();
    character.sheet.hitPoints.current = 12;
    character.sheet.hitPoints.max = 8;

    render(
      <InspectorPanel
        assetDataUrls={{}}
        character={character}
        onAttachArt={vi.fn()}
        onMutate={vi.fn()}
        onRemoveArt={vi.fn()}
        region="combat"
      />,
    );

    expect(screen.getByText("Combat checks")).toBeInTheDocument();
    expect(screen.getByText("Current HP is higher than max HP.")).toBeInTheDocument();
  });
});
