import type { CharacterFileV1, SheetRegion } from "./character";

type GuidanceState = "complete" | "required" | "recommended";

export type RegionGuidanceItem = {
  label: string;
  detail: string;
  state: GuidanceState;
};

export type RegionGuidance = {
  title: string;
  summary: string;
  items: RegionGuidanceItem[];
  issues: string[];
};

function hasText(value: string) {
  return Boolean(value.trim());
}

function hasMeaningfulClassName(value: string) {
  const normalized = value.trim().toLowerCase();
  return normalized.length > 0 && normalized !== "adventurer";
}

function uniqueNormalized(values: string[]) {
  return new Set(values.map((value) => value.trim().toLowerCase()).filter(Boolean));
}

function isLikelySpellcaster(className: string) {
  const normalized = className.trim().toLowerCase();
  return [
    "artificer",
    "bard",
    "cleric",
    "druid",
    "paladin",
    "ranger",
    "sorcerer",
    "warlock",
    "wizard",
  ].includes(normalized);
}

function summarizeChecklist(
  title: string,
  items: RegionGuidanceItem[],
  fallbackCopy: string,
): RegionGuidance {
  const completedCount = items.filter((item) => item.state === "complete").length;
  const summary =
    completedCount === items.length
      ? `All ${items.length} checklist items are in place.`
      : `${completedCount}/${items.length} checklist items are currently ready. ${fallbackCopy}`;

  return {
    title,
    summary,
    items,
    issues: [],
  };
}

export function getRegionGuidance(
  character: CharacterFileV1,
  region: SheetRegion,
): RegionGuidance | null {
  if (region === "identity") {
    return summarizeChecklist(
      "Identity checklist",
      [
        {
          label: "Character name",
          detail: "Required so the sheet is easy to identify in the library.",
          state: hasText(character.metadata.name) ? "complete" : "required",
        },
        {
          label: "Class",
          detail: 'Replace the generic "Adventurer" placeholder with a real class.',
          state: hasMeaningfulClassName(character.build.className) ? "complete" : "required",
        },
        {
          label: "Species",
          detail: "Recommended so the headline reads like a real character.",
          state: hasText(character.build.species) ? "complete" : "recommended",
        },
        {
          label: "Background",
          detail: "Recommended for a less blank first page.",
          state: hasText(character.build.background) ? "complete" : "recommended",
        },
      ],
      "Fill in the missing identity pieces before moving deeper into the sheet.",
    );
  }

  if (region === "abilities") {
    const untouchedAbilities = Object.values(character.build.abilities).every(
      (score) => score === 10,
    );

    return {
      title: "Ability guidance",
      summary: untouchedAbilities
        ? "All six abilities are still at the neutral default of 10."
        : "Ability scores have been customized from the default starter values.",
      items: [
        {
          label: "Custom ability scores",
          detail: "New sheets start at 10 across the board until you replace them.",
          state: untouchedAbilities ? "recommended" : "complete",
        },
      ],
      issues: [],
    };
  }

  if (region === "skills") {
    const saveCount = character.build.savingThrowProficiencies.length;
    const trainedSkillCount = Object.values(character.build.skillRanks).filter(
      (rank) => rank > 0,
    ).length;

    return {
      title: "Skills and saves",
      summary:
        saveCount || trainedSkillCount
          ? `${saveCount} saving throw proficiencies and ${trainedSkillCount} trained skills are set.`
          : "No saving throw proficiencies or trained skills have been chosen yet.",
      items: [
        {
          label: "Saving throw proficiencies",
          detail: "Choose the abilities this character should be proficient in.",
          state: saveCount > 0 ? "complete" : "recommended",
        },
        {
          label: "Skill proficiencies",
          detail: "Set trained skills so passive values and derived modifiers are useful.",
          state: trainedSkillCount > 0 ? "complete" : "recommended",
        },
      ],
      issues: [],
    };
  }

  if (region === "combat") {
    const issues: string[] = [];

    if (character.sheet.hitPoints.current > character.sheet.hitPoints.max) {
      issues.push("Current HP is higher than max HP.");
    }

    if (!hasText(character.sheet.hitPoints.hitDice)) {
      issues.push("Hit dice is blank.");
    }

    return {
      title: "Combat checks",
      summary:
        issues.length > 0
          ? `${issues.length} combat value${issues.length === 1 ? "" : "s"} need attention.`
          : "Core combat values look internally consistent.",
      items: [
        {
          label: "Hit point range",
          detail: "Current HP should stay at or below max HP.",
          state:
            character.sheet.hitPoints.current <= character.sheet.hitPoints.max
              ? "complete"
              : "required",
        },
        {
          label: "Hit dice",
          detail: "Keep hit dice filled in so rests and recovery are easier to track.",
          state: hasText(character.sheet.hitPoints.hitDice) ? "complete" : "required",
        },
      ],
      issues,
    };
  }

  if (region === "attacks") {
    const unnamedCount = character.build.attacks.filter(
      (attack) => !hasText(attack.name),
    ).length;
    const missingDamageCount = character.build.attacks.filter(
      (attack) => !hasText(attack.damage),
    ).length;
    const issues: string[] = [];

    if (!character.build.attacks.length) {
      issues.push("No attack entries exist yet.");
    }
    if (unnamedCount > 0) {
      issues.push(
        `${unnamedCount} attack entr${unnamedCount === 1 ? "y has" : "ies have"} no name.`,
      );
    }
    if (missingDamageCount > 0) {
      issues.push(
        `${missingDamageCount} attack entr${missingDamageCount === 1 ? "y is" : "ies are"} missing damage.`,
      );
    }

    return {
      title: "Attack readiness",
      summary:
        issues.length > 0
          ? "Clean up unfinished attack rows so the sheet reads clearly at the table."
          : "Attack rows look ready to print and play from.",
      items: [
        {
          label: "At least one attack entry",
          detail: "Add a row for any weapon, cantrip, or recurring action you expect to use.",
          state: character.build.attacks.length > 0 ? "complete" : "required",
        },
        {
          label: "Named attacks with damage",
          detail: "Blank names or damage strings are easy to miss during play.",
          state:
            unnamedCount === 0 && missingDamageCount === 0 ? "complete" : "required",
        },
      ],
      issues,
    };
  }

  if (region === "portrait" || region === "featureArt" || region === "spellArt") {
    const asset = character.art.find((entry) => entry.slot === region);

    return {
      title: "Art slot",
      summary: asset
        ? "An art file is attached to this slot."
        : "This art slot is empty. That is fine unless you want printed artwork here.",
      items: [
        {
          label: "Attached art",
          detail: "Art is optional, but adding it gives the printed sheet more personality.",
          state: asset ? "complete" : "recommended",
        },
      ],
      issues: [],
    };
  }

  if (region === "features") {
    return {
      title: "Features notes",
      summary: hasText(character.sheet.features)
        ? "Feature notes are present."
        : "This section is still blank.",
      items: [
        {
          label: "Features and traits",
          detail: "Recommended for anything the player references often.",
          state: hasText(character.sheet.features) ? "complete" : "recommended",
        },
      ],
      issues: [],
    };
  }

  if (region === "inventory") {
    const hasLanguages = character.build.languages.length > 0;
    const hasProficiencies = character.build.proficiencies.length > 0;
    const hasEquipment = hasText(character.sheet.equipment);

    return {
      title: "Inventory readiness",
      summary:
        hasLanguages || hasProficiencies || hasEquipment
          ? "Some inventory and proficiency details are already filled in."
          : "Languages, proficiencies, and equipment are all still blank.",
      items: [
        {
          label: "Languages",
          detail: "Helpful if the character speaks something unusual.",
          state: hasLanguages ? "complete" : "recommended",
        },
        {
          label: "Proficiencies",
          detail: "Useful for tools, armor, and weapon reminders.",
          state: hasProficiencies ? "complete" : "recommended",
        },
        {
          label: "Equipment",
          detail: "Recommended before printing or using the sheet in play.",
          state: hasEquipment ? "complete" : "recommended",
        },
      ],
      issues: [],
    };
  }

  if (region === "notes") {
    return {
      title: "Notes section",
      summary: hasText(character.sheet.notes)
        ? "Freeform notes are present."
        : "Notes are empty right now.",
      items: [
        {
          label: "Session notes",
          detail: "Optional. Good for reminders that do not fit elsewhere on the sheet.",
          state: hasText(character.sheet.notes) ? "complete" : "recommended",
        },
      ],
      issues: [],
    };
  }

  if (region === "spellcasting") {
    const caster = isLikelySpellcaster(character.build.className);
    const slotIssues = character.sheet.spellcasting.slots.filter(
      (slot) => slot.current > slot.max,
    ).length;
    const unnamedSpells = character.sheet.spellcasting.spellbook.filter(
      (spell) => !hasText(spell.name),
    ).length;
    const duplicateSpells =
      uniqueNormalized(character.sheet.spellcasting.spellbook.map((spell) => spell.name))
        .size !==
      character.sheet.spellcasting.spellbook.map((spell) => spell.name.trim()).filter(Boolean)
        .length;
    const issues: string[] = [];

    if (slotIssues > 0) {
      issues.push(
        `${slotIssues} spell slot row${
          slotIssues === 1 ? " has" : "s have"
        } current slots above max.`,
      );
    }
    if (unnamedSpells > 0) {
      issues.push(
        `${unnamedSpells} spell entr${unnamedSpells === 1 ? "y has" : "ies have"} no name.`,
      );
    }
    if (duplicateSpells) {
      issues.push("The spellbook has duplicate spell names.");
    }

    return {
      title: "Spellcasting checks",
      summary: !caster && !character.sheet.spellcasting.spellbook.length && slotIssues === 0
        ? "This section is optional for non-spellcasters."
        : issues.length > 0
          ? "Clean up spell rows and slot values before relying on this section."
          : "Spellcasting values look internally consistent.",
      items: [
        {
          label: "Spell slots stay in range",
          detail: "Current spell slots should never exceed max slots.",
          state: slotIssues === 0 ? "complete" : "required",
        },
        {
          label: "Named spell entries",
          detail: "Blank spell rows are easy to miss once the list gets long.",
          state: unnamedSpells === 0 ? "complete" : "required",
        },
        {
          label: "Spells or notes for casting classes",
          detail: caster
            ? "Recommended for classes that expect spell support on the sheet."
            : "Optional for non-spellcasters.",
          state:
            !caster ||
            character.sheet.spellcasting.spellbook.length > 0 ||
            character.sheet.spellcasting.slots.some((slot) => slot.max > 0)
              ? "complete"
              : "recommended",
        },
      ],
      issues,
    };
  }

  if (region === "custom") {
    const untitledSections = character.customSections.filter(
      (section) => !hasText(section.title),
    ).length;

    return {
      title: "Custom sections",
      summary: character.customSections.length
        ? `${character.customSections.length} custom section${character.customSections.length === 1 ? "" : "s"} added.`
        : "No custom sections yet.",
      items: [
        {
          label: "Custom content added",
          detail: "Optional. Use this if the standard sheet layout is missing something important.",
          state: character.customSections.length ? "complete" : "recommended",
        },
        {
          label: "Section titles",
          detail: "Untitled sections are hard to scan later.",
          state: untitledSections === 0 ? "complete" : "required",
        },
      ],
      issues:
        untitledSections > 0
          ? [
              `${untitledSections} custom section${
                untitledSections === 1 ? "" : "s"
              } still need a title.`,
            ]
          : [],
    };
  }

  return null;
}
