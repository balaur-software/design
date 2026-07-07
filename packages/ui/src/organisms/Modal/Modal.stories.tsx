import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { expect, fn, waitFor, within } from "storybook/test";
import { Modal, type ModalProps } from "./Modal.tsx";

/** Interactive harness: an OPEN button + a self-contained Modal. */
function ModalDemo({
  trigger = "OPEN DIALOG",
  open: _open,
  onClose,
  ...props
}: ModalProps & { trigger?: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen(true)}
        style={{
          fontFamily: "inherit",
          fontSize: 13,
          letterSpacing: "0.1em",
          padding: "12px 20px",
          background: "var(--bx-surface-2, #15161e)",
          border: "1px solid var(--bx-border-accent, #2a3320)",
          color: "var(--bx-accent, #46c66d)",
          cursor: "pointer",
        }}
      >
        {trigger} {"▸"}
      </button>
      <Modal
        {...props}
        open={open}
        onClose={() => {
          setOpen(false);
          onClose();
        }}
      >
        {props.children ?? "Discard the current octant buffer and reset all 256 cell states to zero?"}
      </Modal>
    </div>
  );
}

const meta = {
  title: "OCTANT/Organisms/Modal",
  component: Modal,
  args: {
    open: false,
    onClose: fn(),
    onConfirm: fn(),
  },
} satisfies Meta<typeof Modal>;
export default meta;
type Story = StoryObj<typeof meta>;

/** Danger-toned confirm dialog behind an OPEN DIALOG trigger — confirm fires `onConfirm` then closes. */
export const Default: Story = {
  args: {
    title: "CONFIRM FLUSH",
    tone: "danger",
    confirmLabel: "FLUSH",
    cancelLabel: "CANCEL",
    children:
      "Discard the current octant buffer and reset all 256 cell states to zero? This action clears every lit sub-pixel and cannot be undone.",
  },
  render: (args) => <ModalDemo trigger="OPEN DIALOG" {...args} />,
  play: async ({ canvas, userEvent, args }) => {
    const body = within(document.body);
    await userEvent.click(canvas.getByRole("button", { name: /open dialog/i }));
    const dialog = await body.findByRole("dialog");
    // The panel fades opacity 0 -> 1 on entrance; wait for the transition to start.
    await waitFor(() => expect(dialog).toBeVisible());

    await userEvent.click(body.getByRole("button", { name: /flush/i }));
    await expect(args.onConfirm).toHaveBeenCalledTimes(1);
    await expect(args.onClose).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(body.queryByRole("dialog")).toBeNull());

    // Escape also dismisses.
    await userEvent.click(canvas.getByRole("button", { name: /open dialog/i }));
    await body.findByRole("dialog");
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(body.queryByRole("dialog")).toBeNull());
    await expect(args.onConfirm).toHaveBeenCalledTimes(1);
  },
};

/** Accent-toned variant for a non-destructive commit action. */
export const Accent: Story = {
  args: {
    title: "COMMIT BUFFER",
    tone: "accent",
    confirmLabel: "COMMIT",
    cancelLabel: "CANCEL",
    children:
      "Write the current 256 cell states to the frame store? The committed buffer becomes the new baseline for the next diff pass.",
  },
  render: (args) => <ModalDemo trigger="COMMIT BUFFER" {...args} />,
};

/** A narrower 340px panel for compact prompts. */
export const NarrowPrompt: Story = {
  args: {
    title: "RENAME LAYER",
    tone: "accent",
    confirmLabel: "APPLY",
    width: 340,
    children: "Assign a new identifier to the active octant layer.",
  },
  render: (args) => <ModalDemo trigger="RENAME LAYER" {...args} />,
};

/** Rendered open so the panel layout is visible without interaction. */
export const AlwaysOpen: Story = {
  args: {
    open: true,
    title: "CONFIRM FLUSH",
    tone: "danger",
    confirmLabel: "FLUSH",
    children:
      "Discard the current octant buffer and reset all 256 cell states to zero? This action clears every lit sub-pixel and cannot be undone.",
  },
};
