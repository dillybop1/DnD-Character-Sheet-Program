import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { CharacterLibrary } from "./CharacterLibrary";

describe("CharacterLibrary delete confirmation", () => {
  it("asks for confirmation before deleting the current sheet", () => {
    const onDelete = vi.fn();
    const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(false);

    render(
      <CharacterLibrary
        currentCharacterId="hero-1"
        currentCharacterName="Iris Vale"
        loading={false}
        onCreate={() => {}}
        onDelete={onDelete}
        onDuplicate={() => {}}
        onExport={() => {}}
        onImport={() => {}}
        onSearchChange={() => {}}
        onSelect={() => {}}
        saveStatus="saved"
        search=""
        summaries={[]}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Delete current sheet" }));

    expect(confirmSpy).toHaveBeenCalledWith(
      'Delete the sheet "Iris Vale"? This cannot be undone.',
    );
    expect(onDelete).not.toHaveBeenCalled();

    confirmSpy.mockRestore();
  });

  it("deletes only after the user confirms", () => {
    const onDelete = vi.fn();
    const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(true);

    render(
      <CharacterLibrary
        currentCharacterId="hero-1"
        currentCharacterName="Iris Vale"
        loading={false}
        onCreate={() => {}}
        onDelete={onDelete}
        onDuplicate={() => {}}
        onExport={() => {}}
        onImport={() => {}}
        onSearchChange={() => {}}
        onSelect={() => {}}
        saveStatus="saved"
        search=""
        summaries={[]}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Delete current sheet" }));

    expect(onDelete).toHaveBeenCalledTimes(1);

    confirmSpy.mockRestore();
  });
});

describe("CharacterLibrary screen variant", () => {
  it("shows a resume action for the most relevant sheet", () => {
    const onSelect = vi.fn();

    render(
      <CharacterLibrary
        currentCharacterId="hero-2"
        currentCharacterName="Iris Vale"
        loading={false}
        onCreate={() => {}}
        onDelete={() => {}}
        onDuplicate={() => {}}
        onExport={() => {}}
        onImport={() => {}}
        onSearchChange={() => {}}
        onSelect={onSelect}
        saveStatus="saved"
        search=""
        summaries={[
          {
            id: "hero-1",
            name: "Mora Flint",
            classSummary: "Level 1 - Fighter",
            subtitle: "Player: Rowan",
            updatedAt: "2026-03-05T10:00:00.000Z",
            hasPortrait: false,
            themeId: "clean-parchment-v1",
          },
          {
            id: "hero-2",
            name: "Iris Vale",
            classSummary: "Level 3 - Wizard",
            subtitle: "Player: Dylan",
            updatedAt: "2026-03-06T10:00:00.000Z",
            hasPortrait: true,
            themeId: "clean-parchment-v1",
          },
        ]}
        variant="screen"
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Resume Iris Vale" }));

    expect(onSelect).toHaveBeenCalledWith("hero-2");
    expect(screen.getByRole("heading", { name: "Jump back into recent work" })).toBeInTheDocument();
  });
});
