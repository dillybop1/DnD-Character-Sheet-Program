import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { CreateCharacterDialog } from "./CreateCharacterDialog";

describe("CreateCharacterDialog", () => {
  it("shows guided progress and enables creation after the required step is complete", () => {
    render(
      <CreateCharacterDialog
        onClose={() => {}}
        onCreate={vi.fn().mockResolvedValue(undefined)}
        open
      />,
    );

    const createButton = screen.getByRole("button", { name: "Create character" });

    expect(screen.getByText("1 required step left")).toBeInTheDocument();
    expect(createButton).toBeDisabled();

    fireEvent.change(screen.getByLabelText(/Character name/i), {
      target: { value: "Iris Vale" },
    });

    expect(screen.getByText("Ready to create")).toBeInTheDocument();
    expect(createButton).toBeEnabled();
  });

  it("submits the guided form with the default starter values", async () => {
    const onCreate = vi.fn().mockResolvedValue(undefined);

    render(<CreateCharacterDialog onClose={() => {}} onCreate={onCreate} open />);

    fireEvent.change(screen.getByLabelText(/Character name/i), {
      target: { value: "Iris Vale" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Create character" }));

    await waitFor(() =>
      expect(onCreate).toHaveBeenCalledWith({
        name: "Iris Vale",
        playerName: "",
        className: "",
        species: "",
        background: "",
        level: 1,
      }),
    );
  });

  it("applies a starter preset to the class, species, and background fields", () => {
    render(
      <CreateCharacterDialog
        onClose={() => {}}
        onCreate={vi.fn().mockResolvedValue(undefined)}
        open
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /Wizard Sage/i }));

    expect(screen.getByLabelText(/Class/i)).toHaveValue("Wizard");
    expect(screen.getByLabelText(/Species/i)).toHaveValue("Elf");
    expect(screen.getByLabelText(/Background/i)).toHaveValue("Sage");
    expect(screen.getByLabelText(/Level/i)).toHaveValue(1);
  });
});
