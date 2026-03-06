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
