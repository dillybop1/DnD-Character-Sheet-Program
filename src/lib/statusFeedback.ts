export type SaveStatus = "idle" | "loading" | "dirty" | "saving" | "saved" | "error";

type StatusTone = "neutral" | "warning" | "success" | "error";

type CommandFailureContext =
  | "loadLibrary"
  | "createCharacter"
  | "openCharacter"
  | "saveCharacter"
  | "deleteCharacter"
  | "duplicateCharacter"
  | "importBundle"
  | "exportBundle"
  | "attachArt"
  | "removeArt";

const saveStatusLabels: Record<SaveStatus, string> = {
  idle: "Ready",
  loading: "Loading",
  dirty: "Unsaved changes",
  saving: "Saving...",
  saved: "All changes saved",
  error: "Needs attention",
};

const saveStatusTones: Record<SaveStatus, StatusTone> = {
  idle: "neutral",
  loading: "neutral",
  dirty: "warning",
  saving: "neutral",
  saved: "success",
  error: "error",
};

const commandFailureMessages: Record<CommandFailureContext, string> = {
  loadLibrary: "Could not load the character library.",
  createCharacter: "Could not create this sheet.",
  openCharacter: "Could not open this sheet.",
  saveCharacter: "Could not save this sheet. Your edits are still open in the app.",
  deleteCharacter: "Could not delete this sheet.",
  duplicateCharacter: "Could not duplicate this sheet.",
  importBundle: "Could not import that .dcsheet bundle.",
  exportBundle: "Could not export this .dcsheet bundle.",
  attachArt: "Could not attach that art file.",
  removeArt: "Could not remove that art file.",
};

function extractErrorDetail(error: unknown) {
  if (error instanceof Error) {
    return error.message.trim() || null;
  }

  if (typeof error === "string") {
    return error.trim() || null;
  }

  return null;
}

export function getSaveStatusLabel(status: SaveStatus) {
  return saveStatusLabels[status];
}

export function getSaveStatusTone(status: SaveStatus) {
  return saveStatusTones[status];
}

export function formatLibraryStatus(
  sheetCount: number,
  loading: boolean,
  saveStatus: SaveStatus,
) {
  if (loading) {
    return "Loading sheets";
  }

  const countLabel = `${sheetCount} ${sheetCount === 1 ? "sheet" : "sheets"}`;
  return `${countLabel} - ${getSaveStatusLabel(saveStatus)}`;
}

export function formatCommandError(context: CommandFailureContext, error: unknown) {
  const message = commandFailureMessages[context];
  const detail = extractErrorDetail(error);

  if (!detail || detail.toLowerCase() === message.toLowerCase()) {
    return message;
  }

  return `${message} Details: ${detail}`;
}
