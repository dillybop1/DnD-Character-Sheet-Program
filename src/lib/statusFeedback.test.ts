import { describe, expect, it } from "vitest";
import {
  formatCommandError,
  formatLibraryStatus,
  getSaveStatusLabel,
  getSaveStatusTone,
} from "./statusFeedback";

describe("status feedback helpers", () => {
  it("maps internal save states to clear user-facing labels", () => {
    expect(getSaveStatusLabel("idle")).toBe("Ready");
    expect(getSaveStatusLabel("dirty")).toBe("Unsaved changes");
    expect(getSaveStatusLabel("saved")).toBe("All changes saved");
    expect(getSaveStatusTone("dirty")).toBe("warning");
    expect(getSaveStatusTone("error")).toBe("error");
  });

  it("formats the library status with loading and sheet counts", () => {
    expect(formatLibraryStatus(0, true, "loading")).toBe("Loading sheets");
    expect(formatLibraryStatus(1, false, "saved")).toBe("1 sheet - All changes saved");
    expect(formatLibraryStatus(3, false, "dirty")).toBe("3 sheets - Unsaved changes");
  });

  it("formats command failures without duplicating the fallback copy", () => {
    expect(formatCommandError("saveCharacter", new Error("The file is locked."))).toBe(
      "Could not save this sheet. Your edits are still open in the app. Details: The file is locked.",
    );

    expect(
      formatCommandError("loadLibrary", new Error("Could not load the character library.")),
    ).toBe("Could not load the character library.");
  });
});
