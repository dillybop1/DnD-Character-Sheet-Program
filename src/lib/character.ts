import { z } from "zod";

export const abilityKeys = [
  "strength",
  "dexterity",
  "constitution",
  "intelligence",
  "wisdom",
  "charisma",
] as const;

export const saveablePages = ["core", "features", "spells"] as const;

export const regionOrderByPage = {
  core: ["identity", "abilities", "skills", "combat", "attacks", "portrait"] as const,
  features: ["features", "inventory", "notes", "featureArt", "custom"] as const,
  spells: ["spellcasting", "spellArt", "custom"] as const,
};

export const skillDefinitions = [
  { key: "acrobatics", label: "Acrobatics", ability: "dexterity" },
  { key: "animalHandling", label: "Animal Handling", ability: "wisdom" },
  { key: "arcana", label: "Arcana", ability: "intelligence" },
  { key: "athletics", label: "Athletics", ability: "strength" },
  { key: "deception", label: "Deception", ability: "charisma" },
  { key: "history", label: "History", ability: "intelligence" },
  { key: "insight", label: "Insight", ability: "wisdom" },
  { key: "intimidation", label: "Intimidation", ability: "charisma" },
  { key: "investigation", label: "Investigation", ability: "intelligence" },
  { key: "medicine", label: "Medicine", ability: "wisdom" },
  { key: "nature", label: "Nature", ability: "intelligence" },
  { key: "perception", label: "Perception", ability: "wisdom" },
  { key: "performance", label: "Performance", ability: "charisma" },
  { key: "persuasion", label: "Persuasion", ability: "charisma" },
  { key: "religion", label: "Religion", ability: "intelligence" },
  { key: "sleightOfHand", label: "Sleight of Hand", ability: "dexterity" },
  { key: "stealth", label: "Stealth", ability: "dexterity" },
  { key: "survival", label: "Survival", ability: "wisdom" },
] as const;

export type AbilityKey = (typeof abilityKeys)[number];
export type SkillKey = (typeof skillDefinitions)[number]["key"];
export type SheetPage = (typeof saveablePages)[number];
export type SheetRegion =
  | "identity"
  | "abilities"
  | "skills"
  | "combat"
  | "attacks"
  | "portrait"
  | "features"
  | "inventory"
  | "notes"
  | "featureArt"
  | "spellcasting"
  | "spellArt"
  | "custom";
export type RulesetId = "dnd5e-2024-srd-5.2.1";
export type ArtSlot = "portrait" | "featureArt" | "spellArt";

const abilityScoreSchema = z.number().int().min(1).max(30);
const skillRankSchema = z.union([z.literal(0), z.literal(1), z.literal(2)]);

const abilityRecordSchema = z.object(
  Object.fromEntries(abilityKeys.map((ability) => [ability, abilityScoreSchema])) as Record<
    AbilityKey,
    typeof abilityScoreSchema
  >,
);

const skillRankRecordSchema = z.object(
  Object.fromEntries(skillDefinitions.map((skill) => [skill.key, skillRankSchema])) as Record<
    SkillKey,
    typeof skillRankSchema
  >,
);

const attackEntrySchema = z.object({
  id: z.string(),
  name: z.string(),
  attackBonus: z.number().int(),
  damage: z.string(),
  notes: z.string(),
});

const spellEntrySchema = z.object({
  id: z.string(),
  name: z.string(),
  level: z.number().int().min(0).max(9),
  prepared: z.boolean(),
  notes: z.string(),
});

const spellSlotSchema = z.object({
  level: z.number().int().min(1).max(9),
  current: z.number().int().min(0).max(99),
  max: z.number().int().min(0).max(99),
});

const checklistItemSchema = z.object({
  id: z.string(),
  label: z.string(),
  checked: z.boolean(),
});

const artAssetRefSchema = z.object({
  id: z.string(),
  slot: z.enum(["portrait", "featureArt", "spellArt"]),
  fileName: z.string(),
  mimeType: z.string(),
});

const themeSchema = z.object({
  id: z.literal("clean-parchment-v1"),
  effectLevel: z.enum(["low", "medium"]),
});

const customSectionSchema = z.discriminatedUnion("type", [
  z.object({
    id: z.string(),
    type: z.literal("note"),
    title: z.string(),
    page: z.enum(["features", "spells"]),
    content: z.string(),
  }),
  z.object({
    id: z.string(),
    type: z.literal("tracker"),
    title: z.string(),
    page: z.enum(["features", "spells"]),
    current: z.number().int(),
    max: z.number().int().min(0),
  }),
  z.object({
    id: z.string(),
    type: z.literal("checklist"),
    title: z.string(),
    page: z.enum(["features", "spells"]),
    items: z.array(checklistItemSchema),
  }),
]);

export const createCharacterInputSchema = z.object({
  name: z.string().trim().min(2).max(60),
  playerName: z.string().trim().max(60).optional().or(z.literal("")),
  className: z.string().trim().max(60).optional().or(z.literal("")),
  species: z.string().trim().max(60).optional().or(z.literal("")),
  background: z.string().trim().max(60).optional().or(z.literal("")),
  level: z.number().int().min(1).max(20),
});

export const characterFileSchema = z.object({
  schemaVersion: z.literal(1),
  id: z.string(),
  ruleset: z.literal("dnd5e-2024-srd-5.2.1"),
  metadata: z.object({
    name: z.string().trim().min(1),
    playerName: z.string(),
    campaign: z.string(),
    createdAt: z.string(),
    updatedAt: z.string(),
  }),
  art: z.array(artAssetRefSchema),
  build: z.object({
    className: z.string(),
    subclass: z.string(),
    background: z.string(),
    alignment: z.string(),
    species: z.string(),
    level: z.number().int().min(1).max(20),
    abilities: abilityRecordSchema,
    savingThrowProficiencies: z.array(z.enum(abilityKeys)),
    skillRanks: skillRankRecordSchema,
    languages: z.array(z.string()),
    proficiencies: z.array(z.string()),
    attacks: z.array(attackEntrySchema),
  }),
  sheet: z.object({
    armorClass: z.number().int().min(0).max(99),
    speed: z.number().int().min(0).max(200),
    initiativeBonusOverride: z.number().int().nullable(),
    hitPoints: z.object({
      current: z.number().int().min(0).max(999),
      max: z.number().int().min(1).max(999),
      temporary: z.number().int().min(0).max(999),
      hitDice: z.string(),
    }),
    deathSaves: z.object({
      successes: z.number().int().min(0).max(3),
      failures: z.number().int().min(0).max(3),
    }),
    conditions: z.array(z.string()),
    currency: z.object({
      cp: z.number().int().min(0),
      sp: z.number().int().min(0),
      ep: z.number().int().min(0),
      gp: z.number().int().min(0),
      pp: z.number().int().min(0),
    }),
    features: z.string(),
    equipment: z.string(),
    notes: z.string(),
    spellcasting: z.object({
      castingAbility: z.enum(abilityKeys),
      concentrationNotes: z.string(),
      spellAttackBonusOverride: z.number().int().nullable(),
      spellSaveDcOverride: z.number().int().nullable(),
      slots: z.array(spellSlotSchema),
      spellbook: z.array(spellEntrySchema),
    }),
  }),
  customSections: z.array(customSectionSchema),
  theme: themeSchema,
});

export const characterSummarySchema = z.object({
  id: z.string(),
  name: z.string(),
  classSummary: z.string(),
  subtitle: z.string(),
  updatedAt: z.string(),
  hasPortrait: z.boolean(),
  themeId: z.string(),
});

export type CreateCharacterInput = z.infer<typeof createCharacterInputSchema>;
export type ArtAssetRef = z.infer<typeof artAssetRefSchema>;
export type AttackEntry = z.infer<typeof attackEntrySchema>;
export type SpellEntry = z.infer<typeof spellEntrySchema>;
export type SpellSlot = z.infer<typeof spellSlotSchema>;
export type CustomSection = z.infer<typeof customSectionSchema>;
export type CharacterFileV1 = z.infer<typeof characterFileSchema>;
export type CharacterSummary = z.infer<typeof characterSummarySchema>;

export type DerivedCharacter = {
  abilityModifiers: Record<AbilityKey, number>;
  proficiencyBonus: number;
  savingThrows: Record<AbilityKey, number>;
  skills: Record<SkillKey, number>;
  passivePerception: number;
  passiveInvestigation: number;
  passiveInsight: number;
  initiative: number;
  spellAttackBonus: number;
  spellSaveDc: number;
};

export function createBlankCharacter(input: CreateCharacterInput): CharacterFileV1 {
  const now = new Date().toISOString();

  return {
    schemaVersion: 1,
    id: crypto.randomUUID(),
    ruleset: "dnd5e-2024-srd-5.2.1",
    metadata: {
      name: input.name.trim(),
      playerName: input.playerName?.trim() ?? "",
      campaign: "",
      createdAt: now,
      updatedAt: now,
    },
    art: [],
    build: {
      className: input.className?.trim() || "Adventurer",
      subclass: "",
      background: input.background?.trim() || "",
      alignment: "",
      species: input.species?.trim() || "",
      level: input.level,
      abilities: {
        strength: 10,
        dexterity: 10,
        constitution: 10,
        intelligence: 10,
        wisdom: 10,
        charisma: 10,
      },
      savingThrowProficiencies: [],
      skillRanks: Object.fromEntries(
        skillDefinitions.map((skill) => [skill.key, 0]),
      ) as Record<SkillKey, 0 | 1 | 2>,
      languages: [],
      proficiencies: [],
      attacks: [createAttack()],
    },
    sheet: {
      armorClass: 10,
      speed: 30,
      initiativeBonusOverride: null,
      hitPoints: {
        current: 8,
        max: 8,
        temporary: 0,
        hitDice: "1d8",
      },
      deathSaves: {
        successes: 0,
        failures: 0,
      },
      conditions: [],
      currency: {
        cp: 0,
        sp: 0,
        ep: 0,
        gp: 15,
        pp: 0,
      },
      features: "",
      equipment: "",
      notes: "",
      spellcasting: {
        castingAbility: "wisdom",
        concentrationNotes: "",
        spellAttackBonusOverride: null,
        spellSaveDcOverride: null,
        slots: Array.from({ length: 9 }, (_, index) => ({
          level: index + 1,
          current: 0,
          max: 0,
        })),
        spellbook: [],
      },
    },
    customSections: [],
    theme: {
      id: "clean-parchment-v1",
      effectLevel: "low",
    },
  };
}

export function createAttack(): AttackEntry {
  return {
    id: crypto.randomUUID(),
    name: "Attack",
    attackBonus: 0,
    damage: "1d6",
    notes: "",
  };
}

export function createSpell(): SpellEntry {
  return {
    id: crypto.randomUUID(),
    name: "",
    level: 0,
    prepared: false,
    notes: "",
  };
}

export function createCustomSection(type: CustomSection["type"]): CustomSection {
  if (type === "tracker") {
    return {
      id: crypto.randomUUID(),
      type,
      title: "Custom Tracker",
      page: "features",
      current: 0,
      max: 1,
    };
  }

  if (type === "checklist") {
    return {
      id: crypto.randomUUID(),
      type,
      title: "Checklist",
      page: "features",
      items: [
        {
          id: crypto.randomUUID(),
          label: "New task",
          checked: false,
        },
      ],
    };
  }

  return {
    id: crypto.randomUUID(),
    type,
    title: "Notes",
    page: "features",
    content: "",
  };
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function abilityModifier(score: number): number {
  return Math.floor((score - 10) / 2);
}

export function proficiencyBonus(level: number): number {
  return 2 + Math.floor((Math.max(level, 1) - 1) / 4);
}

export function deriveCharacter(character: CharacterFileV1): DerivedCharacter {
  const proficiency = proficiencyBonus(character.build.level);
  const abilityModifiers = Object.fromEntries(
    abilityKeys.map((ability) => [ability, abilityModifier(character.build.abilities[ability])]),
  ) as Record<AbilityKey, number>;

  const savingThrows = Object.fromEntries(
    abilityKeys.map((ability) => [
      ability,
      abilityModifiers[ability] +
        (character.build.savingThrowProficiencies.includes(ability) ? proficiency : 0),
    ]),
  ) as Record<AbilityKey, number>;

  const skills = Object.fromEntries(
    skillDefinitions.map((skill) => [
      skill.key,
      abilityModifiers[skill.ability] + proficiency * character.build.skillRanks[skill.key],
    ]),
  ) as Record<SkillKey, number>;

  const spellAbilityModifier = abilityModifiers[character.sheet.spellcasting.castingAbility];

  return {
    abilityModifiers,
    proficiencyBonus: proficiency,
    savingThrows,
    skills,
    passivePerception: 10 + skills.perception,
    passiveInvestigation: 10 + skills.investigation,
    passiveInsight: 10 + skills.insight,
    initiative:
      character.sheet.initiativeBonusOverride ?? abilityModifiers.dexterity,
    spellAttackBonus:
      character.sheet.spellcasting.spellAttackBonusOverride ??
      spellAbilityModifier +
        proficiency,
    spellSaveDc:
      character.sheet.spellcasting.spellSaveDcOverride ??
      8 +
        spellAbilityModifier +
        proficiency,
  };
}

export function validateCharacter(document: unknown): CharacterFileV1 {
  return characterFileSchema.parse(document);
}

export function formatModifier(value: number): string {
  return value >= 0 ? `+${value}` : `${value}`;
}

export function normalizeDelimitedList(value: string): string[] {
  return value
    .split(/,|\n/)
    .map((entry) => entry.trim())
    .filter(Boolean);
}

export function serializeDelimitedList(items: string[]): string {
  return items.join(", ");
}

export function updateTimestamp(character: CharacterFileV1): CharacterFileV1 {
  return {
    ...character,
    metadata: {
      ...character.metadata,
      updatedAt: new Date().toISOString(),
    },
  };
}
