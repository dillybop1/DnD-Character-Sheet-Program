import {
  abilityKeys,
  createAttack,
  createCustomSection,
  createSpell,
  normalizeDelimitedList,
  serializeDelimitedList,
  skillDefinitions,
  type ArtSlot,
  type CharacterFileV1,
  type SheetRegion,
} from "../lib/character";

type InspectorPanelProps = {
  character: CharacterFileV1;
  region: SheetRegion;
  assetDataUrls: Record<string, string>;
  onMutate: (mutator: (draft: CharacterFileV1) => void) => void;
  onAttachArt: (slot: ArtSlot) => void;
  onRemoveArt: (slot: ArtSlot) => void;
};

function artStatus(character: CharacterFileV1, slot: ArtSlot) {
  return character.art.find((asset) => asset.slot === slot);
}

function updateNumber(
  value: string,
  fallback = 0,
) {
  const parsed = Number(value);
  return Number.isNaN(parsed) ? fallback : parsed;
}

export function InspectorPanel({
  character,
  region,
  assetDataUrls,
  onMutate,
  onAttachArt,
  onRemoveArt,
}: InspectorPanelProps) {
  const portrait = artStatus(character, "portrait");
  const featureArt = artStatus(character, "featureArt");
  const spellArt = artStatus(character, "spellArt");
  const portraitUrl = portrait ? assetDataUrls[portrait.id] : null;
  const featureArtUrl = featureArt ? assetDataUrls[featureArt.id] : null;
  const spellArtUrl = spellArt ? assetDataUrls[spellArt.id] : null;

  return (
    <aside className="inspector-panel">
      <button className="drawer-handle" type="button">
        Inspector
      </button>

      <div className="inspector-section">
        <span>Inspector</span>
        <h2 className="inspector-title">
          {region === "identity" && "Identity"}
          {region === "abilities" && "Abilities"}
          {region === "skills" && "Skills & saves"}
          {region === "combat" && "Combat"}
          {region === "attacks" && "Attacks"}
          {region === "portrait" && "Portrait"}
          {region === "features" && "Features"}
          {region === "inventory" && "Inventory & proficiencies"}
          {region === "notes" && "Notes"}
          {region === "featureArt" && "Feature art"}
          {region === "spellcasting" && "Spellcasting"}
          {region === "spellArt" && "Spell art"}
          {region === "custom" && "Custom sections"}
        </h2>
        <p className="inspector-copy">
          Click any block on the sheet to retarget the editor. Changes update the live
          parchment preview immediately and autosave shortly after.
        </p>
      </div>

      {region === "identity" ? (
        <div className="form-grid">
          <div className="field-group">
            <label htmlFor="identity-name">Character name</label>
            <input
              id="identity-name"
              onChange={(event) => {
                const value = event.currentTarget.value;
                onMutate((draft) => {
                  draft.metadata.name = value;
                });
              }}
              value={character.metadata.name}
            />
          </div>

          <div className="inline-pair">
            <div className="field-group">
              <label htmlFor="identity-player">Player name</label>
              <input
                id="identity-player"
                onChange={(event) => {
                  const value = event.currentTarget.value;
                  onMutate((draft) => {
                    draft.metadata.playerName = value;
                  });
                }}
                value={character.metadata.playerName}
              />
            </div>
            <div className="field-group">
              <label htmlFor="identity-campaign">Campaign</label>
              <input
                id="identity-campaign"
                onChange={(event) => {
                  const value = event.currentTarget.value;
                  onMutate((draft) => {
                    draft.metadata.campaign = value;
                  });
                }}
                value={character.metadata.campaign}
              />
            </div>
          </div>

          <div className="inline-pair">
            <div className="field-group">
              <label htmlFor="identity-class">Class</label>
              <input
                id="identity-class"
                onChange={(event) => {
                  const value = event.currentTarget.value;
                  onMutate((draft) => {
                    draft.build.className = value;
                  });
                }}
                value={character.build.className}
              />
            </div>
            <div className="field-group">
              <label htmlFor="identity-subclass">Subclass</label>
              <input
                id="identity-subclass"
                onChange={(event) => {
                  const value = event.currentTarget.value;
                  onMutate((draft) => {
                    draft.build.subclass = value;
                  });
                }}
                value={character.build.subclass}
              />
            </div>
          </div>

          <div className="inline-pair">
            <div className="field-group">
              <label htmlFor="identity-background">Background</label>
              <input
                id="identity-background"
                onChange={(event) => {
                  const value = event.currentTarget.value;
                  onMutate((draft) => {
                    draft.build.background = value;
                  });
                }}
                value={character.build.background}
              />
            </div>
            <div className="field-group">
              <label htmlFor="identity-species">Species</label>
              <input
                id="identity-species"
                onChange={(event) => {
                  const value = event.currentTarget.value;
                  onMutate((draft) => {
                    draft.build.species = value;
                  });
                }}
                value={character.build.species}
              />
            </div>
          </div>

          <div className="inline-pair">
            <div className="field-group">
              <label htmlFor="identity-alignment">Alignment</label>
              <input
                id="identity-alignment"
                onChange={(event) => {
                  const value = event.currentTarget.value;
                  onMutate((draft) => {
                    draft.build.alignment = value;
                  });
                }}
                value={character.build.alignment}
              />
            </div>
            <div className="field-group">
              <label htmlFor="identity-level">Level</label>
              <input
                id="identity-level"
                max={20}
                min={1}
                onChange={(event) => {
                  const value = updateNumber(event.currentTarget.value, 1);
                  onMutate((draft) => {
                    draft.build.level = Math.min(20, Math.max(1, value));
                  });
                }}
                type="number"
                value={character.build.level}
              />
            </div>
          </div>
        </div>
      ) : null}

      {region === "abilities" ? (
        <div className="form-grid">
          {abilityKeys.map((ability) => (
            <div className="field-group" key={ability}>
              <label htmlFor={`ability-${ability}`}>{ability}</label>
              <input
                id={`ability-${ability}`}
                max={30}
                min={1}
                onChange={(event) => {
                  const value = updateNumber(event.currentTarget.value, 10);
                  onMutate((draft) => {
                    draft.build.abilities[ability] = Math.min(30, Math.max(1, value));
                  });
                }}
                type="number"
                value={character.build.abilities[ability]}
              />
            </div>
          ))}
        </div>
      ) : null}

      {region === "skills" ? (
        <div className="form-grid">
          <div className="list-editor">
            <span className="sheet-panel-label">Saving throw proficiencies</span>
            <div className="toggle-grid">
              {abilityKeys.map((ability) => (
                <label className="check-pill" htmlFor={`save-prof-${ability}`} key={ability}>
                  <input
                    checked={character.build.savingThrowProficiencies.includes(ability)}
                    id={`save-prof-${ability}`}
                    onChange={(event) => {
                      onMutate((draft) => {
                        if (event.currentTarget.checked) {
                          draft.build.savingThrowProficiencies = Array.from(
                            new Set([...draft.build.savingThrowProficiencies, ability]),
                          );
                        } else {
                          draft.build.savingThrowProficiencies = draft.build.savingThrowProficiencies.filter(
                            (entry) => entry !== ability,
                          );
                        }
                      });
                    }}
                    type="checkbox"
                  />
                  <span>{ability}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="list-editor">
            <span className="sheet-panel-label">Skill proficiency ranks</span>
            <div className="inspector-list">
              {skillDefinitions.map((skill) => (
                <div className="inline-pair" key={skill.key}>
                  <div className="field-group">
                    <label htmlFor={`skill-rank-${skill.key}`}>{skill.label}</label>
                    <select
                      id={`skill-rank-${skill.key}`}
                      onChange={(event) => {
                        const value = updateNumber(event.currentTarget.value, 0);
                        onMutate((draft) => {
                          draft.build.skillRanks[skill.key] = Math.min(2, Math.max(0, value)) as 0 | 1 | 2;
                        });
                      }}
                      value={character.build.skillRanks[skill.key]}
                    >
                      <option value={0}>Untrained</option>
                      <option value={1}>Proficient</option>
                      <option value={2}>Expertise</option>
                    </select>
                  </div>
                  <div className="field-group">
                    <label>Ability</label>
                    <input disabled value={skill.ability} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : null}

      {region === "combat" ? (
        <div className="form-grid">
          <div className="inline-pair">
            <div className="field-group">
              <label htmlFor="combat-ac">Armor class</label>
              <input
                id="combat-ac"
                onChange={(event) => {
                  const value = updateNumber(event.currentTarget.value, 10);
                  onMutate((draft) => {
                    draft.sheet.armorClass = Math.max(0, value);
                  });
                }}
                type="number"
                value={character.sheet.armorClass}
              />
            </div>
            <div className="field-group">
              <label htmlFor="combat-speed">Speed</label>
              <input
                id="combat-speed"
                onChange={(event) => {
                  const value = updateNumber(event.currentTarget.value, 30);
                  onMutate((draft) => {
                    draft.sheet.speed = Math.max(0, value);
                  });
                }}
                type="number"
                value={character.sheet.speed}
              />
            </div>
          </div>

          <div className="inline-pair">
            <div className="field-group">
              <label htmlFor="combat-hp-max">Max HP</label>
              <input
                id="combat-hp-max"
                onChange={(event) => {
                  const value = updateNumber(event.currentTarget.value, 1);
                  onMutate((draft) => {
                    draft.sheet.hitPoints.max = Math.max(1, value);
                  });
                }}
                type="number"
                value={character.sheet.hitPoints.max}
              />
            </div>
            <div className="field-group">
              <label htmlFor="combat-hit-dice">Hit dice</label>
              <input
                id="combat-hit-dice"
                onChange={(event) => {
                  const value = event.currentTarget.value;
                  onMutate((draft) => {
                    draft.sheet.hitPoints.hitDice = value;
                  });
                }}
                value={character.sheet.hitPoints.hitDice}
              />
            </div>
          </div>

          <div className="inline-pair">
            <div className="field-group">
              <label htmlFor="combat-current">Current HP</label>
              <input
                id="combat-current"
                onChange={(event) => {
                  const value = updateNumber(event.currentTarget.value, 0);
                  onMutate((draft) => {
                    draft.sheet.hitPoints.current = Math.max(0, value);
                  });
                }}
                type="number"
                value={character.sheet.hitPoints.current}
              />
            </div>
            <div className="field-group">
              <label htmlFor="combat-temp">Temporary HP</label>
              <input
                id="combat-temp"
                onChange={(event) => {
                  const value = updateNumber(event.currentTarget.value, 0);
                  onMutate((draft) => {
                    draft.sheet.hitPoints.temporary = Math.max(0, value);
                  });
                }}
                type="number"
                value={character.sheet.hitPoints.temporary}
              />
            </div>
          </div>

          <div className="inline-pair">
            <div className="field-group">
              <label htmlFor="combat-initiative">Initiative override</label>
              <input
                id="combat-initiative"
                onChange={(event) => {
                  const raw = event.currentTarget.value;
                  onMutate((draft) => {
                    draft.sheet.initiativeBonusOverride = raw === "" ? null : updateNumber(raw, 0);
                  });
                }}
                type="number"
                value={character.sheet.initiativeBonusOverride ?? ""}
              />
            </div>
            <div className="field-group">
              <label htmlFor="combat-conditions">Conditions</label>
              <input
                id="combat-conditions"
                onChange={(event) => {
                  const value = event.currentTarget.value;
                  onMutate((draft) => {
                    draft.sheet.conditions = normalizeDelimitedList(value);
                  });
                }}
                value={serializeDelimitedList(character.sheet.conditions)}
              />
            </div>
          </div>
        </div>
      ) : null}

      {region === "attacks" ? (
        <div className="form-grid">
          <div className="helper-row">
            <span className="sheet-panel-label">Attack entries</span>
            <button
              className="action-button"
              onClick={() => {
                onMutate((draft) => {
                  draft.build.attacks.push(createAttack());
                });
              }}
              type="button"
            >
              Add attack
            </button>
          </div>
          {character.build.attacks.map((attack) => (
            <div className="list-editor" key={attack.id}>
              <div className="attack-row">
                <input
                  onChange={(event) => {
                    const value = event.currentTarget.value;
                    onMutate((draft) => {
                      const target = draft.build.attacks.find((entry) => entry.id === attack.id);
                      if (target) {
                        target.name = value;
                      }
                    });
                  }}
                  placeholder="Attack name"
                  value={attack.name}
                />
                <input
                  onChange={(event) => {
                    const value = updateNumber(event.currentTarget.value, 0);
                    onMutate((draft) => {
                      const target = draft.build.attacks.find((entry) => entry.id === attack.id);
                      if (target) {
                        target.attackBonus = value;
                      }
                    });
                  }}
                  placeholder="To hit"
                  type="number"
                  value={attack.attackBonus}
                />
                <input
                  onChange={(event) => {
                    const value = event.currentTarget.value;
                    onMutate((draft) => {
                      const target = draft.build.attacks.find((entry) => entry.id === attack.id);
                      if (target) {
                        target.damage = value;
                      }
                    });
                  }}
                  placeholder="Damage"
                  value={attack.damage}
                />
                <input
                  onChange={(event) => {
                    const value = event.currentTarget.value;
                    onMutate((draft) => {
                      const target = draft.build.attacks.find((entry) => entry.id === attack.id);
                      if (target) {
                        target.notes = value;
                      }
                    });
                  }}
                  placeholder="Notes"
                  value={attack.notes}
                />
                <button
                  className="remove-button"
                  onClick={() => {
                    onMutate((draft) => {
                      draft.build.attacks = draft.build.attacks.filter((entry) => entry.id !== attack.id);
                    });
                  }}
                  type="button"
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : null}

      {region === "portrait" || region === "featureArt" || region === "spellArt" ? (
        <div className="form-grid">
          <div className="art-row">
            {portraitUrl && region === "portrait" ? <img alt="Portrait preview" src={portraitUrl} /> : null}
            {featureArtUrl && region === "featureArt" ? <img alt="Feature art preview" src={featureArtUrl} /> : null}
            {spellArtUrl && region === "spellArt" ? <img alt="Spell art preview" src={spellArtUrl} /> : null}
          </div>

          <p className="editor-help">
            Art is stored inside the character bundle and reserved to dedicated layout slots so
            the sheet design remains consistent.
          </p>

          <div className="dialog-actions">
            <button
              className="ghost-button"
              onClick={() => onAttachArt(region === "portrait" ? "portrait" : region === "featureArt" ? "featureArt" : "spellArt")}
              type="button"
            >
              Choose art
            </button>
            <button
              className="action-button"
              onClick={() => onRemoveArt(region === "portrait" ? "portrait" : region === "featureArt" ? "featureArt" : "spellArt")}
              type="button"
            >
              Remove art
            </button>
          </div>
        </div>
      ) : null}

      {region === "features" ? (
        <div className="form-grid">
          <div className="field-group">
            <label htmlFor="features-text">Features & traits</label>
            <textarea
              id="features-text"
              onChange={(event) => {
                const value = event.currentTarget.value;
                onMutate((draft) => {
                  draft.sheet.features = value;
                });
              }}
              value={character.sheet.features}
            />
          </div>
        </div>
      ) : null}

      {region === "inventory" ? (
        <div className="form-grid">
          <div className="field-group">
            <label htmlFor="inventory-languages">Languages</label>
            <input
              id="inventory-languages"
              onChange={(event) => {
                const value = event.currentTarget.value;
                onMutate((draft) => {
                  draft.build.languages = normalizeDelimitedList(value);
                });
              }}
              value={serializeDelimitedList(character.build.languages)}
            />
          </div>
          <div className="field-group">
            <label htmlFor="inventory-proficiencies">Proficiencies</label>
            <input
              id="inventory-proficiencies"
              onChange={(event) => {
                const value = event.currentTarget.value;
                onMutate((draft) => {
                  draft.build.proficiencies = normalizeDelimitedList(value);
                });
              }}
              value={serializeDelimitedList(character.build.proficiencies)}
            />
          </div>
          <div className="field-group">
            <label htmlFor="inventory-equipment">Equipment</label>
            <textarea
              id="inventory-equipment"
              onChange={(event) => {
                const value = event.currentTarget.value;
                onMutate((draft) => {
                  draft.sheet.equipment = value;
                });
              }}
              value={character.sheet.equipment}
            />
          </div>
          <div className="inline-pair">
            {Object.entries(character.sheet.currency).map(([currency, value]) => (
              <div className="field-group" key={currency}>
                <label htmlFor={`currency-${currency}`}>{currency.toUpperCase()}</label>
                <input
                  id={`currency-${currency}`}
                  onChange={(event) => {
                    const nextValue = updateNumber(event.currentTarget.value, 0);
                    onMutate((draft) => {
                      draft.sheet.currency[currency as keyof typeof draft.sheet.currency] = Math.max(0, nextValue);
                    });
                  }}
                  type="number"
                  value={value}
                />
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {region === "notes" ? (
        <div className="form-grid">
          <div className="field-group">
            <label htmlFor="notes-text">Notes</label>
            <textarea
              id="notes-text"
              onChange={(event) => {
                const value = event.currentTarget.value;
                onMutate((draft) => {
                  draft.sheet.notes = value;
                });
              }}
              value={character.sheet.notes}
            />
          </div>
        </div>
      ) : null}

      {region === "spellcasting" ? (
        <div className="form-grid">
          <div className="inline-pair">
            <div className="field-group">
              <label htmlFor="spell-ability">Casting ability</label>
              <select
                id="spell-ability"
                onChange={(event) => {
                  const value = event.currentTarget.value as typeof abilityKeys[number];
                  onMutate((draft) => {
                    draft.sheet.spellcasting.castingAbility = value;
                  });
                }}
                value={character.sheet.spellcasting.castingAbility}
              >
                {abilityKeys.map((ability) => (
                  <option key={ability} value={ability}>
                    {ability}
                  </option>
                ))}
              </select>
            </div>
            <div className="field-group">
              <label htmlFor="spell-attack-override">Spell attack override</label>
              <input
                id="spell-attack-override"
                onChange={(event) => {
                  const raw = event.currentTarget.value;
                  onMutate((draft) => {
                    draft.sheet.spellcasting.spellAttackBonusOverride = raw === "" ? null : updateNumber(raw, 0);
                  });
                }}
                type="number"
                value={character.sheet.spellcasting.spellAttackBonusOverride ?? ""}
              />
            </div>
          </div>

          <div className="inline-pair">
            <div className="field-group">
              <label htmlFor="spell-dc-override">Spell save DC override</label>
              <input
                id="spell-dc-override"
                onChange={(event) => {
                  const raw = event.currentTarget.value;
                  onMutate((draft) => {
                    draft.sheet.spellcasting.spellSaveDcOverride = raw === "" ? null : updateNumber(raw, 0);
                  });
                }}
                type="number"
                value={character.sheet.spellcasting.spellSaveDcOverride ?? ""}
              />
            </div>
            <div className="field-group">
              <label htmlFor="spell-notes">Concentration notes</label>
              <input
                id="spell-notes"
                onChange={(event) => {
                  const value = event.currentTarget.value;
                  onMutate((draft) => {
                    draft.sheet.spellcasting.concentrationNotes = value;
                  });
                }}
                value={character.sheet.spellcasting.concentrationNotes}
              />
            </div>
          </div>

          <div className="list-editor">
            <span className="sheet-panel-label">Spell slots</span>
            <div className="inspector-list">
              {character.sheet.spellcasting.slots.map((slot) => (
                <div className="inline-pair" key={slot.level}>
                  <div className="field-group">
                    <label htmlFor={`slot-current-${slot.level}`}>Level {slot.level} current</label>
                    <input
                      id={`slot-current-${slot.level}`}
                      onChange={(event) => {
                        const value = updateNumber(event.currentTarget.value, 0);
                        onMutate((draft) => {
                          const target = draft.sheet.spellcasting.slots.find((entry) => entry.level === slot.level);
                          if (target) {
                            target.current = Math.max(0, value);
                          }
                        });
                      }}
                      type="number"
                      value={slot.current}
                    />
                  </div>
                  <div className="field-group">
                    <label htmlFor={`slot-max-${slot.level}`}>Level {slot.level} max</label>
                    <input
                      id={`slot-max-${slot.level}`}
                      onChange={(event) => {
                        const value = updateNumber(event.currentTarget.value, 0);
                        onMutate((draft) => {
                          const target = draft.sheet.spellcasting.slots.find((entry) => entry.level === slot.level);
                          if (target) {
                            target.max = Math.max(0, value);
                            target.current = Math.min(target.current, target.max);
                          }
                        });
                      }}
                      type="number"
                      value={slot.max}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="helper-row">
            <span className="sheet-panel-label">Spellbook</span>
            <button
              className="action-button"
              onClick={() => {
                onMutate((draft) => {
                  draft.sheet.spellcasting.spellbook.push(createSpell());
                });
              }}
              type="button"
            >
              Add spell
            </button>
          </div>

          {character.sheet.spellcasting.spellbook.map((spell) => (
            <div className="list-editor" key={spell.id}>
              <div className="spell-row">
                <input
                  onChange={(event) => {
                    const value = event.currentTarget.value;
                    onMutate((draft) => {
                      const target = draft.sheet.spellcasting.spellbook.find((entry) => entry.id === spell.id);
                      if (target) {
                        target.name = value;
                      }
                    });
                  }}
                  placeholder="Spell name"
                  value={spell.name}
                />
                <input
                  max={9}
                  min={0}
                  onChange={(event) => {
                    const value = updateNumber(event.currentTarget.value, 0);
                    onMutate((draft) => {
                      const target = draft.sheet.spellcasting.spellbook.find((entry) => entry.id === spell.id);
                      if (target) {
                        target.level = Math.min(9, Math.max(0, value));
                      }
                    });
                  }}
                  type="number"
                  value={spell.level}
                />
                <select
                  onChange={(event) => {
                    const value = event.currentTarget.value === "prepared";
                    onMutate((draft) => {
                      const target = draft.sheet.spellcasting.spellbook.find((entry) => entry.id === spell.id);
                      if (target) {
                        target.prepared = value;
                      }
                    });
                  }}
                  value={spell.prepared ? "prepared" : "known"}
                >
                  <option value="known">Known only</option>
                  <option value="prepared">Prepared</option>
                </select>
                <input
                  onChange={(event) => {
                    const value = event.currentTarget.value;
                    onMutate((draft) => {
                      const target = draft.sheet.spellcasting.spellbook.find((entry) => entry.id === spell.id);
                      if (target) {
                        target.notes = value;
                      }
                    });
                  }}
                  placeholder="Notes"
                  value={spell.notes}
                />
                <button
                  className="remove-button"
                  onClick={() => {
                    onMutate((draft) => {
                      draft.sheet.spellcasting.spellbook = draft.sheet.spellcasting.spellbook.filter(
                        (entry) => entry.id !== spell.id,
                      );
                    });
                  }}
                  type="button"
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : null}

      {region === "custom" ? (
        <div className="form-grid">
          <div className="helper-row">
            <span className="sheet-panel-label">Custom sections</span>
            <div className="workspace-actions">
              <button
                className="action-button"
                onClick={() => {
                  onMutate((draft) => {
                    draft.customSections.push(createCustomSection("note"));
                  });
                }}
                type="button"
              >
                Note
              </button>
              <button
                className="action-button"
                onClick={() => {
                  onMutate((draft) => {
                    draft.customSections.push(createCustomSection("tracker"));
                  });
                }}
                type="button"
              >
                Tracker
              </button>
              <button
                className="action-button"
                onClick={() => {
                  onMutate((draft) => {
                    draft.customSections.push(createCustomSection("checklist"));
                  });
                }}
                type="button"
              >
                Checklist
              </button>
            </div>
          </div>

          {character.customSections.length ? (
            character.customSections.map((section) => (
              <div className="custom-card list-editor" key={section.id}>
                <div className="inline-pair">
                  <div className="field-group">
                    <label htmlFor={`custom-title-${section.id}`}>Title</label>
                    <input
                      id={`custom-title-${section.id}`}
                      onChange={(event) => {
                        const value = event.currentTarget.value;
                        onMutate((draft) => {
                          const target = draft.customSections.find((entry) => entry.id === section.id);
                          if (target) {
                            target.title = value;
                          }
                        });
                      }}
                      value={section.title}
                    />
                  </div>
                  <div className="field-group">
                    <label htmlFor={`custom-page-${section.id}`}>Page</label>
                    <select
                      id={`custom-page-${section.id}`}
                      onChange={(event) => {
                        const value = event.currentTarget.value as "features" | "spells";
                        onMutate((draft) => {
                          const target = draft.customSections.find((entry) => entry.id === section.id);
                          if (target) {
                            target.page = value;
                          }
                        });
                      }}
                      value={section.page}
                    >
                      <option value="features">Features page</option>
                      <option value="spells">Spells page</option>
                    </select>
                  </div>
                </div>

                {section.type === "note" ? (
                  <div className="field-group">
                    <label htmlFor={`custom-note-${section.id}`}>Content</label>
                    <textarea
                      id={`custom-note-${section.id}`}
                      onChange={(event) => {
                        const value = event.currentTarget.value;
                        onMutate((draft) => {
                          const target = draft.customSections.find((entry) => entry.id === section.id);
                          if (target?.type === "note") {
                            target.content = value;
                          }
                        });
                      }}
                      value={section.content}
                    />
                  </div>
                ) : null}

                {section.type === "tracker" ? (
                  <div className="inline-pair">
                    <div className="field-group">
                      <label htmlFor={`custom-current-${section.id}`}>Current</label>
                      <input
                        id={`custom-current-${section.id}`}
                        onChange={(event) => {
                          const value = updateNumber(event.currentTarget.value, 0);
                          onMutate((draft) => {
                            const target = draft.customSections.find((entry) => entry.id === section.id);
                            if (target?.type === "tracker") {
                              target.current = value;
                            }
                          });
                        }}
                        type="number"
                        value={section.current}
                      />
                    </div>
                    <div className="field-group">
                      <label htmlFor={`custom-max-${section.id}`}>Max</label>
                      <input
                        id={`custom-max-${section.id}`}
                        onChange={(event) => {
                          const value = updateNumber(event.currentTarget.value, 1);
                          onMutate((draft) => {
                            const target = draft.customSections.find((entry) => entry.id === section.id);
                            if (target?.type === "tracker") {
                              target.max = Math.max(0, value);
                            }
                          });
                        }}
                        type="number"
                        value={section.max}
                      />
                    </div>
                  </div>
                ) : null}

                {section.type === "checklist" ? (
                  <div className="field-group">
                    <label htmlFor={`custom-list-${section.id}`}>Checklist items</label>
                    <textarea
                      id={`custom-list-${section.id}`}
                      onChange={(event) => {
                        const value = event.currentTarget.value;
                        onMutate((draft) => {
                          const target = draft.customSections.find((entry) => entry.id === section.id);
                          if (target?.type === "checklist") {
                            target.items = value
                              .split("\n")
                              .map((line) => line.trim())
                              .filter(Boolean)
                              .map((line, index) => ({
                                id: target.items[index]?.id ?? crypto.randomUUID(),
                                label: line,
                                checked: target.items[index]?.checked ?? false,
                              }));
                          }
                        });
                      }}
                      value={section.items.map((item) => item.label).join("\n")}
                    />
                  </div>
                ) : null}

                <button
                  className="remove-button"
                  onClick={() => {
                    onMutate((draft) => {
                      draft.customSections = draft.customSections.filter((entry) => entry.id !== section.id);
                    });
                  }}
                  type="button"
                >
                  Remove section
                </button>
              </div>
            ))
          ) : (
            <div className="inspector-empty">
              <div>
                <h2 className="inspector-title">No custom sections yet</h2>
                <p className="inspector-copy">
                  Add a note block, tracker, or checklist and place it on the features or
                  spells page.
                </p>
              </div>
            </div>
          )}
        </div>
      ) : null}
    </aside>
  );
}
