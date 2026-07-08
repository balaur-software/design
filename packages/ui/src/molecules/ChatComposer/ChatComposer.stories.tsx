import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn, waitFor } from "storybook/test";
import { ChatComposer } from "./ChatComposer";

const meta = {
  title: "OCTANT/Molecules/ChatComposer",
  component: ChatComposer,
  args: { onSend: fn(), onValueChange: fn(), onStop: fn() },
  argTypes: {
    value: { control: "text", description: "Controlled value." },
    defaultValue: { control: "text" },
    streaming: { control: "boolean" },
    placeholder: { control: "text" },
  },
} satisfies Meta<typeof ChatComposer>;
export default meta;

type Story = StoryObj<typeof meta>;

/** The resting composer — Enter sends the trimmed text and clears the textarea. */
export const Idle: Story = {
  play: async ({ args, canvas, userEvent }) => {
    const textarea = canvas.getByRole("textbox");
    await userEvent.type(textarea, "rasterise the field{Enter}");
    await expect(args.onSend).toHaveBeenCalledWith("rasterise the field");
    await expect(textarea).toHaveValue("");
  },
};

/** While the agent streams, the textarea is disabled and Stop replaces Send. */
export const Streaming: Story = {
  args: { streaming: true },
  play: async ({ args, canvas, userEvent }) => {
    await expect(canvas.getByRole("textbox")).toBeDisabled();
    await userEvent.click(canvas.getByRole("button", { name: /stop generation/i }));
    await expect(args.onStop).toHaveBeenCalledTimes(1);
  },
};

/** Pre-filled text — the send button is enabled and fires onSend on click. */
export const WithText: Story = {
  args: { defaultValue: "rasterise the field" },
  play: async ({ args, canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole("button", { name: /send/i }));
    await expect(args.onSend).toHaveBeenCalledWith("rasterise the field");
  },
};

/**
 * App-controlled attachments render as chips above the textarea; each chip's ×
 * fires onRemoveAttachment with the id, and sending passes the attachments as
 * onSend's second argument.
 */
export const WithAttachments: Story = {
  args: {
    attachments: [
      { id: "a1", name: "raster.ts", kind: "code", size: 2048, status: "ready" },
      { id: "a2", name: "uploading.png", kind: "image", size: 245760, status: "pending" },
      { id: "a3", name: "failed.md", kind: "document", status: "error" },
    ],
    onRemoveAttachment: fn(),
  },
  play: async ({ args, canvas, userEvent }) => {
    // All chips render; pending/error status dots are visible.
    await expect(canvas.getByText("raster.ts")).toBeInTheDocument();
    await expect(canvas.getByText("uploading.png")).toBeInTheDocument();
    await expect(canvas.getByText("failed.md")).toBeInTheDocument();
    await expect(canvas.getByRole("img", { name: "pending" })).toBeInTheDocument();
    await expect(canvas.getByRole("img", { name: "error" })).toBeInTheDocument();

    // The chip's separate remove control fires with the attachment id.
    await userEvent.click(canvas.getByRole("button", { name: /remove raster\.ts/i }));
    await expect(args.onRemoveAttachment).toHaveBeenCalledWith("a1");

    // Sending forwards the attachments as the second onSend argument.
    await userEvent.type(canvas.getByRole("textbox"), "ship it{Enter}");
    await expect(args.onSend).toHaveBeenCalledWith("ship it", args.attachments);
  },
};

/**
 * Native-picker mode: `onFiles` renders the paperclip and a hidden
 * `<input type="file" multiple>`. A change on that input forwards the raw
 * `File[]` and resets the input so the same file can be re-selected. (The
 * paperclip itself is not clicked here — that would open a real OS dialog.)
 */
export const NativePicker: Story = {
  args: { onFiles: fn() },
  play: async ({ args, canvas, canvasElement }) => {
    await expect(canvas.getByRole("button", { name: /attach files/i })).toBeInTheDocument();
    const input = canvasElement.querySelector<HTMLInputElement>('input[type="file"]');
    await expect(input).not.toBeNull();
    if (!input) return;
    await expect(input.multiple).toBe(true);

    // Simulate the picker returning a file: set files and fire `change` directly.
    const file = new File(["let x = 1"], "raster.ts", { type: "text/plain" });
    const dt = new DataTransfer();
    dt.items.add(file);
    input.files = dt.files;
    input.dispatchEvent(new Event("change", { bubbles: true }));
    await waitFor(() => expect(args.onFiles).toHaveBeenCalledWith([file]));
    // Reset after forwarding, so re-selecting the same file still fires change.
    await expect(input.value).toBe("");
  },
};

/**
 * Custom-picker mode: `onAttachRequest` wins over `onFiles` — no hidden file
 * input renders, and the paperclip calls the app's picker instead.
 */
export const CustomPicker: Story = {
  args: { onFiles: fn(), onAttachRequest: fn() },
  play: async ({ args, canvas, canvasElement, userEvent }) => {
    await expect(canvasElement.querySelector('input[type="file"]')).toBeNull();
    await userEvent.click(canvas.getByRole("button", { name: /attach files/i }));
    await expect(args.onAttachRequest).toHaveBeenCalledTimes(1);
    await expect(args.onFiles).not.toHaveBeenCalled();
  },
};

/**
 * A leading `/` opens the command menu under the textarea; typing filters it,
 * ↓/↑ move the highlight (clamped), Enter commits the highlighted command and
 * removes the `/query` token, Escape closes without commit.
 */
export const SlashCommands: Story = {
  args: {
    commands: [
      { id: "summarize", name: "summarize", hint: "condense the thread" },
      { id: "explain", name: "explain", hint: "explain the last artifact" },
      { id: "deploy", name: "deploy", hint: "trigger a deploy", glyph: "▸" },
    ],
    onCommand: fn(),
  },
  play: async ({ args, canvas, userEvent }) => {
    // With commands, the textarea presents as a combobox.
    const textarea = canvas.getByRole("combobox");
    await expect(textarea).toHaveAttribute("aria-expanded", "false");

    // Typing a leading "/" opens the menu with the full list.
    await userEvent.type(textarea, "/");
    await waitFor(() => expect(canvas.getByRole("option", { name: /summarize/i })).toBeVisible());
    await expect(canvas.getAllByRole("option")).toHaveLength(3);
    await expect(textarea).toHaveAttribute("aria-expanded", "true");

    // ↓ moves the highlight to the second command.
    await userEvent.keyboard("{ArrowDown}");
    await waitFor(() =>
      expect(canvas.getByRole("option", { name: /explain/i })).toHaveAttribute("aria-selected", "true"),
    );

    // Enter commits the highlighted id and removes the /query token.
    await userEvent.keyboard("{Enter}");
    await expect(args.onCommand).toHaveBeenCalledWith("explain");
    await expect(textarea).toHaveValue("");
    await expect(args.onSend).not.toHaveBeenCalled();

    // Typing more after the slash filters the list.
    await userEvent.type(textarea, "/de");
    await waitFor(() => expect(canvas.getAllByRole("option")).toHaveLength(1));
    await expect(canvas.getByRole("option", { name: /deploy/i })).toBeVisible();

    // Escape closes the menu without a commit.
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(canvas.queryByRole("option", { name: /deploy/i })).not.toBeInTheDocument());
    await expect(args.onCommand).toHaveBeenCalledTimes(1);
  },
};
