import type { CreateCharacterInput } from "./character";

export type CreateCharacterGuidanceItem = {
  key: "name" | "level" | "className" | "species" | "background";
  label: string;
  state: "complete" | "required" | "recommended";
  guidance: string;
};

export type CreateCharacterGuidance = {
  readyToCreate: boolean;
  summaryTitle: string;
  summaryCopy: string;
  completedCount: number;
  totalCount: number;
  items: CreateCharacterGuidanceItem[];
};

export const createCharacterDefaultValues: CreateCharacterInput = {
  name: "",
  playerName: "",
  className: "",
  species: "",
  background: "",
  level: 1,
};

function hasText(value: string | undefined) {
  return Boolean(value?.trim());
}

function hasValidLevel(value: number | undefined) {
  return typeof value === "number" && Number.isInteger(value) && value >= 1 && value <= 20;
}

export function getCreateCharacterGuidance(
  values: Partial<CreateCharacterInput>,
): CreateCharacterGuidance {
  const nameReady = hasText(values.name) && (values.name?.trim().length ?? 0) >= 2;
  const levelReady = hasValidLevel(values.level);
  const classReady = hasText(values.className);
  const speciesReady = hasText(values.species);
  const backgroundReady = hasText(values.background);

  const items: CreateCharacterGuidanceItem[] = [
    {
      key: "name",
      label: "Character name",
      state: nameReady ? "complete" : "required",
      guidance: "Required so the sheet can be created and identified in the library.",
    },
    {
      key: "level",
      label: "Level",
      state: levelReady ? "complete" : "required",
      guidance: "Required. Level 1 is the safest default for a brand-new sheet.",
    },
    {
      key: "className",
      label: "Class",
      state: classReady ? "complete" : "recommended",
      guidance: "Recommended so the sheet headline and starter stats feel less blank.",
    },
    {
      key: "species",
      label: "Species",
      state: speciesReady ? "complete" : "recommended",
      guidance: "Recommended so the starter identity section reads like a real character.",
    },
    {
      key: "background",
      label: "Background",
      state: backgroundReady ? "complete" : "recommended",
      guidance: "Recommended, but safe to fill in later once the sheet is open.",
    },
  ];

  const completedCount = items.filter((item) => item.state === "complete").length;
  const requiredRemainingCount = items.filter((item) => item.state === "required").length;
  const recommendedRemainingCount = items.filter(
    (item) => item.state === "recommended",
  ).length;

  let summaryTitle = "Ready to create";
  let summaryCopy =
    "You can create the sheet now. Any recommended details you skip can be filled in later.";

  if (requiredRemainingCount > 0) {
    summaryTitle = `${requiredRemainingCount} required step${
      requiredRemainingCount === 1 ? "" : "s"
    } left`;
    summaryCopy =
      "Finish the required items first. Class, species, and background are recommended, not mandatory.";
  } else if (recommendedRemainingCount === 0) {
    summaryTitle = "Starter details complete";
    summaryCopy =
      "Everything in the quick-start checklist is filled in. Creating now will open a more complete first draft.";
  }

  return {
    readyToCreate: requiredRemainingCount === 0,
    summaryTitle,
    summaryCopy,
    completedCount,
    totalCount: items.length,
    items,
  };
}
