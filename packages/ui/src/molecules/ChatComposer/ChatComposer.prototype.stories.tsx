/**
 * PROTOTYPE — proof of feel, not of code.
 *
 * This file validates plan 012 / the composer input design spec
 * (docs/superpowers/specs/2026-07-08-composer-input-design.md) before any
 * change lands in `ChatComposer.tsx` or `chat-types.ts`. Every mock below
 * (`MockAttachmentChip`, `ComposerPrototype`, the inline slash-command list)
 * is story-local scaffolding built to demonstrate the *feel* of the
 * attachment-chip row and the slash-command menu described in the spec — it
 * is not the real component API, is not exported, and is not consumed
 * anywhere else. In particular, `MockAttachmentChip` stands in for the
 * `atoms/AttachmentChip` the spec calls for in its follow-up build plan;
 * `ArtifactChip` was tried first and its props (`kind`, `title`, `onClick`)
 * can't represent a pending/error status or host an independent remove
 * control, so this mock exists instead of stretching that atom to fit.
 */
import type { Meta, StoryObj } from "@storybook/react-vite";
import { useMemo, useState } from "react";
import { expect, fn, waitFor } from "storybook/test";
import { FloatingPanel } from "../../primitives";
import { ChatComposer } from "./ChatComposer";

interface MockAttachment {
  id: string;
  name: string;
  kind: "code" | "document" | "image";
}

const ICON: Record<MockAttachment["kind"], string> = { code: "{ }", document: "¶", image: "▦" };

/** Story-local stand-in for the future `atoms/AttachmentChip` (see file doc comment). */
function MockAttachmentChip({
  attachment,
  onRemove,
}: {
  attachment: MockAttachment;
  onRemove: (id: string) => void;
}) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        fontFamily: "var(--bx-font-mono, 'DepartureMono', ui-monospace, monospace)",
        fontSize: 12,
        padding: "5px 6px 5px 10px",
        background: "var(--bx-surface-2, #0b0d10)",
        border: "1px solid var(--bx-border, #1c1d24)",
        color: "var(--bx-text-3, #c8cdd6)",
      }}
    >
      <span aria-hidden="true" style={{ color: "var(--bx-accent, #46c66d)" }}>
        {ICON[attachment.kind]}
      </span>
      <span>{attachment.name}</span>
      <button
        type="button"
        aria-label={`remove ${attachment.name}`}
        onClick={() => onRemove(attachment.id)}
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          width: 16,
          height: 16,
          fontFamily: "inherit",
          fontSize: 12,
          lineHeight: 1,
          background: "transparent",
          border: 0,
          color: "var(--bx-text-6, #5b616e)",
          cursor: "pointer",
        }}
      >
        ×
      </button>
    </span>
  );
}

interface MockCommand {
  id: string;
  name: string;
  hint?: string;
}

const COMMANDS: MockCommand[] = [
  { id: "summarize", name: "summarize", hint: "condense the thread" },
  { id: "explain", name: "explain", hint: "explain the last artifact" },
  { id: "deploy", name: "deploy", hint: "trigger a deploy" },
];

/** Leading `/query` detector — mirrors the spec's Interaction details §Slash flow. */
function leadingSlashQuery(value: string): string | null {
  const m = /^\/(\S*)$/.exec(value);
  return m ? m[1]! : null;
}

interface ComposerPrototypeProps {
  onSend: (text: string, attachments: MockAttachment[]) => void;
  onCommand: (id: string) => void;
  onRemoveAttachment: (id: string) => void;
}

/**
 * Story-local wrapper: the real `ChatComposer` plus mock attachment chips
 * above it and a mock slash-command menu anchored under it via the shared
 * `FloatingPanel` primitive (spec Decision 3). No production code touched.
 */
function ComposerPrototype({ onSend, onCommand, onRemoveAttachment }: ComposerPrototypeProps) {
  const [value, setValue] = useState("");
  const [attachments, setAttachments] = useState<MockAttachment[]>([
    { id: "a1", name: "raster.ts", kind: "code" },
  ]);
  const [menuOpen, setMenuOpen] = useState(false);

  const query = leadingSlashQuery(value);
  const filtered = useMemo(
    () => COMMANDS.filter((c) => c.name.toLowerCase().startsWith((query ?? "").toLowerCase())),
    [query],
  );

  const handleValueChange = (next: string) => {
    setValue(next);
    setMenuOpen(leadingSlashQuery(next) !== null);
  };

  const remove = (id: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
    onRemoveAttachment(id);
  };

  const choose = (id: string) => {
    setValue("");
    setMenuOpen(false);
    onCommand(id);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8, maxWidth: 480 }}>
      {attachments.length > 0 && (
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {attachments.map((a) => (
            <MockAttachmentChip key={a.id} attachment={a} onRemove={remove} />
          ))}
        </div>
      )}
      <FloatingPanel
        open={menuOpen}
        onOpenChange={setMenuOpen}
        role="listbox"
        width={240}
        panelStyle={{
          background: "var(--bx-surface-3, #0c0d11)",
          border: "1px solid var(--bx-border, #1c1d24)",
          overflow: "hidden",
        }}
        trigger={
          <ChatComposer
            value={value}
            onValueChange={handleValueChange}
            onSend={(text) => onSend(text, attachments)}
          />
        }
      >
        <div>
          {filtered.map((c) => (
            <button
              key={c.id}
              type="button"
              role="option"
              aria-selected={false}
              onClick={() => choose(c.id)}
              style={{
                display: "flex",
                width: "100%",
                gap: 10,
                textAlign: "left",
                fontFamily: "inherit",
                fontSize: 13,
                padding: "8px 12px",
                background: "transparent",
                border: 0,
                color: "var(--bx-text-3, #c8cdd6)",
                cursor: "pointer",
              }}
            >
              <span>/{c.name}</span>
              {c.hint && <span style={{ color: "var(--bx-text-6, #5b616e)" }}>{c.hint}</span>}
            </button>
          ))}
          {filtered.length === 0 && (
            <div style={{ padding: "10px 12px", color: "var(--bx-text-7, #3f424d)", fontSize: 12 }}>
              no matching command
            </div>
          )}
        </div>
      </FloatingPanel>
    </div>
  );
}

const meta = {
  title: "OCTANT/Molecules/ChatComposer/Prototype",
  component: ComposerPrototype,
  args: { onSend: fn(), onCommand: fn(), onRemoveAttachment: fn() },
} satisfies Meta<typeof ComposerPrototype>;
export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Prototype only — not the real ChatComposer API. Demonstrates: a pending
 * attachment chip with a working remove control, and a slash-command menu
 * that opens on a leading `/` and closes on Escape.
 */
export const Prototype: Story = {
  play: async ({ args, canvas, userEvent }) => {
    // A pending attachment chip renders with a working remove control.
    const removeBtn = canvas.getByRole("button", { name: /remove raster\.ts/i });
    await userEvent.click(removeBtn);
    await expect(args.onRemoveAttachment).toHaveBeenCalledWith("a1");

    // Typing a leading "/" opens the slash-command menu.
    const textarea = canvas.getByRole("textbox");
    await userEvent.type(textarea, "/");
    const option = canvas.getByRole("option", { name: /summarize/i });
    await waitFor(() => expect(option).toBeVisible());

    // Escape hides the menu again without invoking a command.
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(option).not.toBeVisible());
    await expect(args.onCommand).not.toHaveBeenCalled();
  },
};
