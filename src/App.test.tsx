import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { CharacterFileV1, CharacterSummary } from "./lib/character";
import { createBlankCharacter } from "./lib/character";
import { characterToSummary } from "./lib/characterPresentation";

const apiMocks = vi.hoisted(() => ({
  chooseArtAsset: vi.fn(),
  chooseExportBundle: vi.fn(),
  chooseImportBundle: vi.fn(),
  deleteCharacter: vi.fn(),
  duplicateCharacter: vi.fn(),
  listCharacters: vi.fn(),
  saveCharacter: vi.fn(),
}));

const repositoryMocks = vi.hoisted(() => ({
  attachArtToCharacter: vi.fn(),
  exportCharacterRecord: vi.fn(),
  importCharacterRecord: vi.fn(),
  loadCharacterRecord: vi.fn(),
  removeArtFromCharacter: vi.fn(),
}));

vi.mock("./lib/tauri", () => apiMocks);
vi.mock("./lib/characterRepository", () => repositoryMocks);

import App from "./App";
import { useCharacterStore } from "./store/useCharacterStore";

function buildCharacter(overrides?: Partial<CharacterFileV1>) {
  const character = createBlankCharacter({
    name: "Iris Vale",
    className: "Wizard",
    species: "Elf",
    background: "Sage",
    playerName: "Dylan",
    level: 3,
  });

  return {
    ...character,
    ...overrides,
    metadata: {
      ...character.metadata,
      ...overrides?.metadata,
    },
    build: {
      ...character.build,
      ...overrides?.build,
    },
    sheet: {
      ...character.sheet,
      ...overrides?.sheet,
    },
    theme: {
      ...character.theme,
      ...overrides?.theme,
    },
    art: overrides?.art ?? character.art,
    customSections: overrides?.customSections ?? character.customSections,
  };
}

function buildSummary(overrides?: Partial<CharacterSummary>): CharacterSummary {
  return {
    ...characterToSummary(buildCharacter()),
    ...overrides,
  };
}

function resetStore() {
  act(() => {
    useCharacterStore.setState({
      summaries: [],
      currentCharacter: null,
      assetDataUrls: {},
      activePage: "core",
      selectedRegion: "identity",
      search: "",
      saveStatus: "idle",
      error: null,
      notice: null,
      loading: false,
      dirty: false,
    });
  });
}

describe("App roster navigation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetStore();
  });

  it("opens on the roster screen instead of the workspace shell", async () => {
    apiMocks.listCharacters.mockResolvedValue([
      buildSummary({
        id: "hero-1",
        name: "Iris Vale",
      }),
    ]);

    render(<App />);

    expect(await screen.findByRole("button", { name: /Iris Vale/i })).toBeInTheDocument();
    expect(screen.getByText("Choose a sheet to enter the live workspace, or create and import one below.")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Return to roster" })).not.toBeInTheDocument();
  });

  it("enters a sheet from the roster and lets the user return", async () => {
    const character = buildCharacter({
      id: "hero-1",
      metadata: {
        ...buildCharacter().metadata,
        name: "Iris Vale",
      },
    });

    apiMocks.listCharacters.mockResolvedValue([
      buildSummary({
        id: character.id,
        name: character.metadata.name,
      }),
    ]);
    repositoryMocks.loadCharacterRecord.mockResolvedValue({
      character,
      assetDataUrls: {},
      recoveryNotice: null,
    });

    render(<App />);

    fireEvent.click(await screen.findByRole("button", { name: /Iris Vale/i }));

    expect(await screen.findByRole("button", { name: "Return to roster" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Iris Vale" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Return to roster" }));

    await waitFor(() =>
      expect(screen.queryByRole("button", { name: "Return to roster" })).not.toBeInTheDocument(),
    );
    expect(screen.getByRole("button", { name: /Iris Vale/i })).toBeInTheDocument();
  });
});
