import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import {
  createCharacterInputSchema,
  type CreateCharacterInput,
} from "../lib/character";

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
    defaultValues: {
      name: "",
      playerName: "",
      className: "",
      species: "",
      background: "",
      level: 1,
    },
  });

  useEffect(() => {
    if (!open) {
      form.reset();
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

        <form
          className="dialog-form"
          onSubmit={form.handleSubmit(async (values) => {
            await onCreate(values);
          })}
        >
          <div className="inline-pair">
            <div className="field-group">
              <label htmlFor="character-name">Character name</label>
              <input id="character-name" {...form.register("name")} placeholder="Elara Briarwind" />
              {form.formState.errors.name ? (
                <span className="error-copy">{form.formState.errors.name.message}</span>
              ) : null}
            </div>

            <div className="field-group">
              <label htmlFor="player-name">Player name</label>
              <input id="player-name" {...form.register("playerName")} placeholder="Optional" />
            </div>
          </div>

          <div className="inline-pair">
            <div className="field-group">
              <label htmlFor="class-name">Class</label>
              <input id="class-name" {...form.register("className")} placeholder="Wizard" />
            </div>

            <div className="field-group">
              <label htmlFor="species-name">Species</label>
              <input id="species-name" {...form.register("species")} placeholder="Elf" />
            </div>
          </div>

          <div className="inline-pair">
            <div className="field-group">
              <label htmlFor="background">Background</label>
              <input id="background" {...form.register("background")} placeholder="Sage" />
            </div>

            <div className="field-group">
              <label htmlFor="level">Level</label>
              <input
                id="level"
                type="number"
                min={1}
                max={20}
                {...form.register("level", { valueAsNumber: true })}
              />
            </div>
          </div>

          <div className="dialog-actions">
            <button className="ghost-button" onClick={onClose} type="button">
              Cancel
            </button>
            <button className="action-button primary" type="submit">
              Create character
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
