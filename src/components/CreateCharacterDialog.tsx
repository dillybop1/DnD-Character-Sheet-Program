import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import {
  createCharacterInputSchema,
  type CreateCharacterInput,
} from "../lib/character";
import {
  createCharacterDefaultValues,
  getCreateCharacterGuidance,
} from "../lib/createCharacterGuidance";
import {
  applyCreateCharacterPreset,
  createCharacterPresets,
  findActiveCreateCharacterPreset,
} from "../lib/createCharacterPresets";

type CreateCharacterDialogProps = {
  open: boolean;
  onClose: () => void;
  onCreate: (values: CreateCharacterInput) => Promise<void>;
};

export function CreateCharacterDialog({
  open,
  onClose,
  onCreate,
}: CreateCharacterDialogProps) {
  const form = useForm<CreateCharacterInput>({
    resolver: zodResolver(createCharacterInputSchema),
    defaultValues: createCharacterDefaultValues,
  });
  const values = form.watch();
  const guidance = getCreateCharacterGuidance(values);
  const activePreset = findActiveCreateCharacterPreset(values);

  useEffect(() => {
    if (!open) {
      form.reset(createCharacterDefaultValues);
    }
  }, [form, open]);

  if (!open) {
    return null;
  }

  return (
    <div className="dialog-backdrop" role="presentation">
      <div className="dialog-card" role="dialog" aria-modal="true" aria-labelledby="create-sheet-title">
        <span className="library-kicker">Create a new sheet</span>
        <h2 id="create-sheet-title">Start with a fresh parchment packet.</h2>
        <p className="sheet-copy">
          This creates the local character bundle and opens the live sheet workspace
          immediately.
        </p>

        <div className="create-guidance-card">
          <div className="helper-row">
            <div>
              <span className="library-kicker">Starter presets</span>
              <h3 className="dialog-section-title">Pick a quick 5e starting point</h3>
            </div>
            <span className="tag-pill">{`${createCharacterPresets.length} presets`}</span>
          </div>
          <p className="sheet-copy">
            Presets fill in class, species, background, and level. Your character name and
            player name stay untouched.
          </p>
          <div className="preset-grid">
            {createCharacterPresets.map((preset) => (
              <button
                className={`preset-button${activePreset?.id === preset.id ? " active" : ""}`}
                key={preset.id}
                onClick={() => {
                  form.reset(applyCreateCharacterPreset(form.getValues(), preset));
                }}
                type="button"
              >
                <strong>{preset.label}</strong>
                <span>{preset.summary}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="create-guidance-card">
          <div className="helper-row">
            <div>
              <span className="library-kicker">Guided setup</span>
              <h3 className="dialog-section-title">{guidance.summaryTitle}</h3>
            </div>
            <span className="tag-pill">{`${guidance.completedCount}/${guidance.totalCount} ready`}</span>
          </div>
          <p className="sheet-copy">{guidance.summaryCopy}</p>

          <div className="create-guidance-list">
            {guidance.items.map((item) => (
              <div className="create-guidance-item" key={item.key}>
                <div>
                  <strong>{item.label}</strong>
                  <p className="field-hint">{item.guidance}</p>
                </div>
                <span className={`tag-pill create-step-${item.state}`}>
                  {item.state === "complete"
                    ? "Ready"
                    : item.state === "required"
                      ? "Required"
                      : "Recommended"}
                </span>
              </div>
            ))}
          </div>
        </div>

        <form
          className="dialog-form"
          onSubmit={form.handleSubmit(async (values) => {
            await onCreate(values);
          })}
        >
          <div className="inline-pair">
            <div className="field-group">
              <label htmlFor="character-name">
                Character name
                <span className="field-hint">Required to create the sheet.</span>
              </label>
              <input id="character-name" {...form.register("name")} placeholder="Elara Briarwind" />
              {form.formState.errors.name ? (
                <span className="error-copy">{form.formState.errors.name.message}</span>
              ) : null}
            </div>

            <div className="field-group">
              <label htmlFor="player-name">
                Player name
                <span className="field-hint">Optional. Helpful if you track multiple players.</span>
              </label>
              <input id="player-name" {...form.register("playerName")} placeholder="Optional" />
            </div>
          </div>

          <div className="inline-pair">
            <div className="field-group">
              <label htmlFor="class-name">
                Class
                <span className="field-hint">Recommended for a more useful first draft.</span>
              </label>
              <input id="class-name" {...form.register("className")} placeholder="Wizard" />
            </div>

            <div className="field-group">
              <label htmlFor="species-name">
                Species
                <span className="field-hint">Recommended, but safe to fill in later.</span>
              </label>
              <input id="species-name" {...form.register("species")} placeholder="Elf" />
            </div>
          </div>

          <div className="inline-pair">
            <div className="field-group">
              <label htmlFor="background">
                Background
                <span className="field-hint">Recommended to make the identity section less blank.</span>
              </label>
              <input id="background" {...form.register("background")} placeholder="Sage" />
            </div>

            <div className="field-group">
              <label htmlFor="level">
                Level
                <span className="field-hint">Required. Defaults to level 1.</span>
              </label>
              <input
                id="level"
                type="number"
                min={1}
                max={20}
                {...form.register("level", { valueAsNumber: true })}
              />
              {form.formState.errors.level ? (
                <span className="error-copy">{form.formState.errors.level.message}</span>
              ) : null}
            </div>
          </div>

          <div className="dialog-actions">
            <button className="ghost-button" onClick={onClose} type="button">
              Cancel
            </button>
            <button
              className="action-button primary"
              disabled={!guidance.readyToCreate || form.formState.isSubmitting}
              type="submit"
            >
              Create character
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
