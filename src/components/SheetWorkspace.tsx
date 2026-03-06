import type { ReactNode } from "react";
import {
  abilityKeys,
  deriveCharacter,
  formatModifier,
  skillDefinitions,
  type CharacterFileV1,
  type CustomSection,
  type SheetPage,
  type SheetRegion,
} from "../lib/character";

type SheetWorkspaceProps = {
  character: CharacterFileV1;
  assetDataUrls: Record<string, string>;
  activePage: SheetPage;
  selectedRegion: SheetRegion;
  onSelectRegion: (region: SheetRegion) => void;
  onMutate: (mutator: (draft: CharacterFileV1) => void) => void;
};

function RegionCard({
  children,
  className,
  label,
  selected,
  onSelect,
}: {
  children: ReactNode;
  className: string;
  label: string;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <section
      className={`${className} sheet-panel${selected ? " selected" : ""}`}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onSelect();
        }
      }}
      onClick={onSelect}
      role="button"
      tabIndex={0}
    >
      <span className="sheet-panel-label">{label}</span>
      {children}
    </section>
  );
}

function findArtUrl(character: CharacterFileV1, assetDataUrls: Record<string, string>, slot: "portrait" | "featureArt" | "spellArt") {
  const asset = character.art.find((entry) => entry.slot === slot);
  return asset ? assetDataUrls[asset.id] : null;
}

function renderCustomSection(
  section: CustomSection,
  onMutate: SheetWorkspaceProps["onMutate"],
  selected: boolean,
  onSelect: () => void,
) {
  if (section.type === "note") {
    return (
      <RegionCard
        className="span-6"
        key={section.id}
        label={section.title}
        onSelect={onSelect}
        selected={selected}
      >
        <div className="sheet-note-lines">
          <p className="notes-paragraph">{section.content || "Add flavor notes in the inspector."}</p>
        </div>
      </RegionCard>
    );
  }

  if (section.type === "tracker") {
    return (
      <RegionCard
        className="span-6"
        key={section.id}
        label={section.title}
        onSelect={onSelect}
        selected={selected}
      >
        <div className="tracker-row">
          <button
            className="tracker-button"
            onClick={(event) => {
              event.stopPropagation();
              onMutate((draft) => {
                const tracker = draft.customSections.find((entry) => entry.id === section.id);
                if (tracker?.type === "tracker") {
                  tracker.current = Math.max(0, tracker.current - 1);
                }
              });
            }}
            type="button"
          >
            -
          </button>
          <span className="tracker-value">
            {section.current}/{section.max}
          </span>
          <button
            className="tracker-button"
            onClick={(event) => {
              event.stopPropagation();
              onMutate((draft) => {
                const tracker = draft.customSections.find((entry) => entry.id === section.id);
                if (tracker?.type === "tracker") {
                  tracker.current = Math.min(tracker.max, tracker.current + 1);
                }
              });
            }}
            type="button"
          >
            +
          </button>
        </div>
      </RegionCard>
    );
  }

  return (
    <RegionCard
      className="span-6"
      key={section.id}
      label={section.title}
      onSelect={onSelect}
      selected={selected}
    >
      <div className="skills-list">
        {section.items.length ? (
          section.items.map((item) => (
            <div className="check-pill" key={item.id}>
              <span className={`check-dot${item.checked ? " active" : ""}`} />
              <span>{item.label}</span>
            </div>
          ))
        ) : (
          <p className="editor-help">Add checklist items from the inspector.</p>
        )}
      </div>
    </RegionCard>
  );
}

export function SheetWorkspace({
  character,
  assetDataUrls,
  activePage,
  selectedRegion,
  onSelectRegion,
  onMutate,
}: SheetWorkspaceProps) {
  const derived = deriveCharacter(character);
  const portraitUrl = findArtUrl(character, assetDataUrls, "portrait");
  const featureArtUrl = findArtUrl(character, assetDataUrls, "featureArt");
  const spellArtUrl = findArtUrl(character, assetDataUrls, "spellArt");
  const featureCustomSections = character.customSections.filter((section) => section.page === "features");
  const spellCustomSections = character.customSections.filter((section) => section.page === "spells");

  return (
    <div className="sheet-stage">
      <div className="sheet-page">
        <div className="sheet-banner">
          <div className="sheet-banner-copy">
            <span>{character.build.className || "Adventurer"}</span>
            <strong>{character.metadata.name}</strong>
          </div>
          <span className="tag-pill">{character.theme.id}</span>
        </div>

        {activePage === "core" ? (
          <>
            <div className="sheet-page-title">
              <div>
                <h2>Core sheet</h2>
                <p className="sheet-copy">
                  Vital statistics, skills, combat notes, and the visual identity panel.
                </p>
              </div>
              <span className="page-stamp">Page I</span>
            </div>

            <div className="sheet-grid">
              <RegionCard
                className="span-8"
                label="Identity"
                onSelect={() => onSelectRegion("identity")}
                selected={selectedRegion === "identity"}
              >
                <div className="sheet-summary-grid">
                  <div className="metric-box">
                    <span className="metric-label">Class</span>
                    <span className="metric-value">{character.build.className}</span>
                  </div>
                  <div className="metric-box">
                    <span className="metric-label">Level</span>
                    <span className="metric-value">{character.build.level}</span>
                  </div>
                  <div className="metric-box">
                    <span className="metric-label">Species</span>
                    <span className="metric-value">{character.build.species || "Unset"}</span>
                  </div>
                  <div className="metric-box">
                    <span className="metric-label">Background</span>
                    <span className="metric-value">{character.build.background || "Unset"}</span>
                  </div>
                </div>
                <p className="sheet-body-copy">
                  {character.metadata.playerName
                    ? `Player ${character.metadata.playerName}`
                    : "Add a player name, campaign, and alignment in the inspector."}
                </p>
              </RegionCard>

              <RegionCard
                className="portrait-card span-4"
                label="Portrait"
                onSelect={() => onSelectRegion("portrait")}
                selected={selectedRegion === "portrait"}
              >
                {portraitUrl ? (
                  <img alt={`${character.metadata.name} portrait`} src={portraitUrl} />
                ) : (
                  <div className="art-placeholder">
                    <div>
                      <strong>Portrait panel</strong>
                      Reserve this frame for character art.
                    </div>
                  </div>
                )}
              </RegionCard>

              <RegionCard
                className="span-4"
                label="Abilities"
                onSelect={() => onSelectRegion("abilities")}
                selected={selectedRegion === "abilities"}
              >
                <div className="sheet-mini-grid">
                  {abilityKeys.map((ability) => (
                    <div className="ability-pill" key={ability}>
                      <span className="metric-label">{ability.slice(0, 3)}</span>
                      <span>{character.build.abilities[ability]}</span>
                      <span className="ability-mod">{formatModifier(derived.abilityModifiers[ability])}</span>
                    </div>
                  ))}
                </div>
              </RegionCard>

              <RegionCard
                className="span-3"
                label="Saving throws"
                onSelect={() => onSelectRegion("skills")}
                selected={selectedRegion === "skills"}
              >
                <div className="save-list">
                  {abilityKeys.map((ability) => (
                    <div className="save-row" key={ability}>
                      <span>{ability}</span>
                      <span>{character.build.savingThrowProficiencies.includes(ability) ? "Prof." : ""}</span>
                      <span className="save-total">{formatModifier(derived.savingThrows[ability])}</span>
                    </div>
                  ))}
                </div>
              </RegionCard>

              <RegionCard
                className="span-5"
                label="Skills"
                onSelect={() => onSelectRegion("skills")}
                selected={selectedRegion === "skills"}
              >
                <div className="sheet-scroller">
                  <div className="skills-list">
                    {skillDefinitions.map((skill) => (
                      <div className="skill-row" key={skill.key}>
                        <span>{skill.label}</span>
                        <span>{character.build.skillRanks[skill.key] === 2 ? "Exp." : character.build.skillRanks[skill.key] === 1 ? "Prof." : ""}</span>
                        <span className="skill-total">{formatModifier(derived.skills[skill.key])}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </RegionCard>

              <RegionCard
                className="span-7"
                label="Combat"
                onSelect={() => onSelectRegion("combat")}
                selected={selectedRegion === "combat"}
              >
                <div className="sheet-mini-grid">
                  <div className="metric-box">
                    <span className="metric-label">Armor class</span>
                    <span className="metric-value">{character.sheet.armorClass}</span>
                  </div>
                  <div className="metric-box">
                    <span className="metric-label">Initiative</span>
                    <span className="metric-value">{formatModifier(derived.initiative)}</span>
                  </div>
                  <div className="metric-box">
                    <span className="metric-label">Speed</span>
                    <span className="metric-value">{character.sheet.speed}</span>
                  </div>
                  <div className="metric-box">
                    <span className="metric-label">Passive perception</span>
                    <span className="metric-value">{derived.passivePerception}</span>
                  </div>
                </div>

                <div className="tracker-row">
                  <span className="metric-label">Current HP</span>
                  <button
                    className="tracker-button"
                    onClick={(event) => {
                      event.stopPropagation();
                      onMutate((draft) => {
                        draft.sheet.hitPoints.current = Math.max(0, draft.sheet.hitPoints.current - 1);
                      });
                    }}
                    type="button"
                  >
                    -
                  </button>
                  <input
                    className="sheet-inline-input"
                    onChange={(event) => {
                      const value = Number(event.currentTarget.value);
                      onMutate((draft) => {
                        draft.sheet.hitPoints.current = Number.isNaN(value)
                          ? 0
                          : Math.max(0, value);
                      });
                    }}
                    type="number"
                    value={character.sheet.hitPoints.current}
                  />
                  <button
                    className="tracker-button"
                    onClick={(event) => {
                      event.stopPropagation();
                      onMutate((draft) => {
                        draft.sheet.hitPoints.current = Math.min(
                          draft.sheet.hitPoints.max,
                          draft.sheet.hitPoints.current + 1,
                        );
                      });
                    }}
                    type="button"
                  >
                    +
                  </button>
                </div>

                <div className="tracker-row">
                  <span className="metric-label">Temporary HP</span>
                  <button
                    className="tracker-button"
                    onClick={(event) => {
                      event.stopPropagation();
                      onMutate((draft) => {
                        draft.sheet.hitPoints.temporary = Math.max(0, draft.sheet.hitPoints.temporary - 1);
                      });
                    }}
                    type="button"
                  >
                    -
                  </button>
                  <input
                    className="sheet-inline-input"
                    onChange={(event) => {
                      const value = Number(event.currentTarget.value);
                      onMutate((draft) => {
                        draft.sheet.hitPoints.temporary = Number.isNaN(value)
                          ? 0
                          : Math.max(0, value);
                      });
                    }}
                    type="number"
                    value={character.sheet.hitPoints.temporary}
                  />
                  <button
                    className="tracker-button"
                    onClick={(event) => {
                      event.stopPropagation();
                      onMutate((draft) => {
                        draft.sheet.hitPoints.temporary += 1;
                      });
                    }}
                    type="button"
                  >
                    +
                  </button>
                </div>

                <div className="check-grid">
                  <div>
                    <span className="metric-label">Death save successes</span>
                    <div className="tracker-row">
                      {[0, 1, 2].map((value) => (
                        <button
                          className={`toggle-button${character.sheet.deathSaves.successes > value ? " active" : ""}`}
                          key={`success-${value}`}
                          onClick={(event) => {
                            event.stopPropagation();
                            onMutate((draft) => {
                              draft.sheet.deathSaves.successes = value + 1 === draft.sheet.deathSaves.successes ? value : value + 1;
                            });
                          }}
                          type="button"
                        >
                          {value + 1}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <span className="metric-label">Death save failures</span>
                    <div className="tracker-row">
                      {[0, 1, 2].map((value) => (
                        <button
                          className={`toggle-button${character.sheet.deathSaves.failures > value ? " active" : ""}`}
                          key={`failure-${value}`}
                          onClick={(event) => {
                            event.stopPropagation();
                            onMutate((draft) => {
                              draft.sheet.deathSaves.failures = value + 1 === draft.sheet.deathSaves.failures ? value : value + 1;
                            });
                          }}
                          type="button"
                        >
                          {value + 1}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </RegionCard>

              <RegionCard
                className="span-5"
                label="Quick actions"
                onSelect={() => onSelectRegion("attacks")}
                selected={selectedRegion === "attacks"}
              >
                <div className="quick-table header">
                  <span>Name</span>
                  <span>To hit</span>
                  <span>Damage</span>
                  <span>Notes</span>
                </div>
                <div className="sheet-list">
                  {character.build.attacks.map((attack) => (
                    <div className="quick-table" key={attack.id}>
                      <span>{attack.name || "Attack"}</span>
                      <span>{formatModifier(attack.attackBonus)}</span>
                      <span>{attack.damage}</span>
                      <span>{attack.notes || " "}</span>
                    </div>
                  ))}
                </div>
              </RegionCard>
            </div>
          </>
        ) : null}

        {activePage === "features" ? (
          <>
            <div className="sheet-page-title">
              <div>
                <h2>Features & gear</h2>
                <p className="sheet-copy">
                  Traits, languages, equipment, notes, and a wide panel for flavor art.
                </p>
              </div>
              <span className="page-stamp">Page II</span>
            </div>

            <div className="sheet-grid">
              <RegionCard
                className="span-7"
                label="Features & traits"
                onSelect={() => onSelectRegion("features")}
                selected={selectedRegion === "features"}
              >
                <div className="sheet-note-lines">
                  <p className="notes-paragraph">
                    {character.sheet.features || "Describe key class features, bonds, flaws, or travel notes."}
                  </p>
                </div>
              </RegionCard>

              <RegionCard
                className="art-card wide span-5"
                label="Feature art"
                onSelect={() => onSelectRegion("featureArt")}
                selected={selectedRegion === "featureArt"}
              >
                {featureArtUrl ? (
                  <img alt="Feature art" src={featureArtUrl} />
                ) : (
                  <div className="art-placeholder">
                    <div>
                      <strong>Feature art</strong>
                      This wide panel is reserved for mood art or a scene piece.
                    </div>
                  </div>
                )}
              </RegionCard>

              <RegionCard
                className="span-4"
                label="Languages & proficiencies"
                onSelect={() => onSelectRegion("inventory")}
                selected={selectedRegion === "inventory"}
              >
                <div className="sheet-mini-grid">
                  <div className="metric-box">
                    <span className="metric-label">Languages</span>
                    <span>{character.build.languages.join(", ") || "None listed"}</span>
                  </div>
                  <div className="metric-box">
                    <span className="metric-label">Proficiencies</span>
                    <span>{character.build.proficiencies.join(", ") || "None listed"}</span>
                  </div>
                </div>
              </RegionCard>

              <RegionCard
                className="span-4"
                label="Currency"
                onSelect={() => onSelectRegion("inventory")}
                selected={selectedRegion === "inventory"}
              >
                <div className="sheet-mini-grid">
                  {Object.entries(character.sheet.currency).map(([currency, value]) => (
                    <div className="metric-box" key={currency}>
                      <span className="metric-label">{currency.toUpperCase()}</span>
                      <span className="metric-value">{value}</span>
                    </div>
                  ))}
                </div>
              </RegionCard>

              <RegionCard
                className="span-4"
                label="Equipment"
                onSelect={() => onSelectRegion("inventory")}
                selected={selectedRegion === "inventory"}
              >
                <div className="sheet-note-lines">
                  <p className="notes-paragraph">
                    {character.sheet.equipment || "Track weapons, armor, packs, heirlooms, and carried oddities."}
                  </p>
                </div>
              </RegionCard>

              <RegionCard
                className="span-6"
                label="Notes"
                onSelect={() => onSelectRegion("notes")}
                selected={selectedRegion === "notes"}
              >
                <div className="sheet-note-lines">
                  <p className="notes-paragraph">
                    {character.sheet.notes || "Room for campaign notes, NPC reminders, and scene hooks."}
                  </p>
                </div>
              </RegionCard>

              <RegionCard
                className="span-6"
                label="Custom sections"
                onSelect={() => onSelectRegion("custom")}
                selected={selectedRegion === "custom"}
              >
                <p className="sheet-copy">
                  Add note blocks, counters, or checklists from the inspector to personalize
                  this page.
                </p>
              </RegionCard>

              {featureCustomSections.length
                ? featureCustomSections.map((section) =>
                    renderCustomSection(
                      section,
                      onMutate,
                      selectedRegion === "custom",
                      () => onSelectRegion("custom"),
                    ),
                  )
                : null}
            </div>
          </>
        ) : null}

        {activePage === "spells" ? (
          <>
            <div className="sheet-page-title">
              <div>
                <h2>Spellcasting</h2>
                <p className="sheet-copy">
                  Spell attack, DC, slots, prepared spells, and a secondary art panel.
                </p>
              </div>
              <span className="page-stamp">Page III</span>
            </div>

            <div className="sheet-grid">
              <RegionCard
                className="span-6"
                label="Spellcasting"
                onSelect={() => onSelectRegion("spellcasting")}
                selected={selectedRegion === "spellcasting"}
              >
                <div className="sheet-mini-grid">
                  <div className="metric-box">
                    <span className="metric-label">Casting ability</span>
                    <span className="metric-value">
                      {character.sheet.spellcasting.castingAbility}
                    </span>
                  </div>
                  <div className="metric-box">
                    <span className="metric-label">Spell attack</span>
                    <span className="metric-value">
                      {formatModifier(derived.spellAttackBonus)}
                    </span>
                  </div>
                  <div className="metric-box">
                    <span className="metric-label">Spell save DC</span>
                    <span className="metric-value">{derived.spellSaveDc}</span>
                  </div>
                </div>

                <div className="sheet-list">
                  {character.sheet.spellcasting.slots.map((slot) => (
                    <div className="slot-row" key={slot.level}>
                      <span className="metric-label">Level {slot.level}</span>
                      <button
                        className="tracker-button"
                        onClick={(event) => {
                          event.stopPropagation();
                          onMutate((draft) => {
                            const target = draft.sheet.spellcasting.slots.find((entry) => entry.level === slot.level);
                            if (target) {
                              target.current = Math.max(0, target.current - 1);
                            }
                          });
                        }}
                        type="button"
                      >
                        -
                      </button>
                      <span className="tracker-value">
                        {slot.current}/{slot.max}
                      </span>
                      <button
                        className="tracker-button"
                        onClick={(event) => {
                          event.stopPropagation();
                          onMutate((draft) => {
                            const target = draft.sheet.spellcasting.slots.find((entry) => entry.level === slot.level);
                            if (target) {
                              target.current = Math.min(target.max, target.current + 1);
                            }
                          });
                        }}
                        type="button"
                      >
                        +
                      </button>
                    </div>
                  ))}
                </div>
              </RegionCard>

              <RegionCard
                className="art-card wide span-6"
                label="Spell art"
                onSelect={() => onSelectRegion("spellArt")}
                selected={selectedRegion === "spellArt"}
              >
                {spellArtUrl ? (
                  <img alt="Spell art" src={spellArtUrl} />
                ) : (
                  <div className="art-placeholder">
                    <div>
                      <strong>Spell art</strong>
                      Leave this for a sigil, sketch, or spellbook illustration.
                    </div>
                  </div>
                )}
              </RegionCard>

              <RegionCard
                className="span-4"
                label="Concentration & notes"
                onSelect={() => onSelectRegion("spellcasting")}
                selected={selectedRegion === "spellcasting"}
              >
                <div className="sheet-note-lines">
                  <p className="notes-paragraph">
                    {character.sheet.spellcasting.concentrationNotes ||
                      "Document prepared rituals, concentration reminders, and favorite combos."}
                  </p>
                </div>
              </RegionCard>

              <RegionCard
                className="span-8"
                label="Spellbook"
                onSelect={() => onSelectRegion("spellcasting")}
                selected={selectedRegion === "spellcasting"}
              >
                <div className="spell-table header">
                  <span>Spell</span>
                  <span>Level</span>
                  <span>Prepared</span>
                  <span>Notes</span>
                </div>
                <div className="sheet-list">
                  {character.sheet.spellcasting.spellbook.length ? (
                    character.sheet.spellcasting.spellbook.map((spell) => (
                      <div className="spell-table" key={spell.id}>
                        <span>{spell.name || "Spell"}</span>
                        <span>{spell.level}</span>
                        <span>{spell.prepared ? "Yes" : "No"}</span>
                        <span>{spell.notes || " "}</span>
                      </div>
                    ))
                  ) : (
                    <p className="sheet-copy">Populate the spell list from the inspector.</p>
                  )}
                </div>
              </RegionCard>

              <RegionCard
                className="span-6"
                label="Custom sections"
                onSelect={() => onSelectRegion("custom")}
                selected={selectedRegion === "custom"}
              >
                <p className="sheet-copy">
                  Use this page for spell-specific trackers, ritual checklists, or custom notes.
                </p>
              </RegionCard>

              {spellCustomSections.length
                ? spellCustomSections.map((section) =>
                    renderCustomSection(
                      section,
                      onMutate,
                      selectedRegion === "custom",
                      () => onSelectRegion("custom"),
                    ),
                  )
                : null}
            </div>
          </>
        ) : null}

        <div className="sheet-page-footer">
          <span>{character.metadata.updatedAt ? `Updated ${new Date(character.metadata.updatedAt).toLocaleString()}` : ""}</span>
          <span>Original parchment-inspired theme - editable through the inspector</span>
        </div>
      </div>
    </div>
  );
}
