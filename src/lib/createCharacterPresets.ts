import type { CreateCharacterInput } from "./character";

export type CreateCharacterPreset = {
  id: string;
  label: string;
  summary: string;
  values: Pick<CreateCharacterInput, "className" | "species" | "background" | "level">;
};

export const createCharacterPresets: CreateCharacterPreset[] = [
  {
    id: "cleric-acolyte",
    label: "Cleric Acolyte",
    summary: "A divine starter with a temple-trained background.",
    values: {
      className: "Cleric",
      species: "Human",
      background: "Acolyte",
      level: 1,
    },
  },
  {
    id: "fighter-soldier",
    label: "Fighter Soldier",
    summary: "A martial baseline built for straightforward early testing.",
    values: {
      className: "Fighter",
      species: "Human",
      background: "Soldier",
      level: 1,
    },
  },
  {
    id: "rogue-criminal",
    label: "Rogue Criminal",
    summary: "A stealth-focused sheet with an obvious non-caster identity.",
    values: {
      className: "Rogue",
      species: "Halfling",
      background: "Criminal",
      level: 1,
    },
  },
  {
    id: "wizard-sage",
    label: "Wizard Sage",
    summary: "A classic spellcaster setup for testing spellbook-heavy flows.",
    values: {
      className: "Wizard",
      species: "Elf",
      background: "Sage",
      level: 1,
    },
  },
];

function sameText(left: string | undefined, right: string | undefined) {
  return (left ?? "").trim().toLowerCase() === (right ?? "").trim().toLowerCase();
}

export function applyCreateCharacterPreset(
  values: CreateCharacterInput,
  preset: CreateCharacterPreset,
): CreateCharacterInput {
  return {
    ...values,
    ...preset.values,
  };
}

export function findActiveCreateCharacterPreset(
  values: Partial<CreateCharacterInput>,
): CreateCharacterPreset | null {
  return (
    createCharacterPresets.find((preset) => {
      return (
        sameText(values.className, preset.values.className) &&
        sameText(values.species, preset.values.species) &&
        sameText(values.background, preset.values.background) &&
        values.level === preset.values.level
      );
    }) ?? null
  );
}
