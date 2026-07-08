import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { expect, fn, waitFor } from "storybook/test";
import { useControllableState } from "./useControllableState";

/** Minimal fixture exposing useControllableState's rendered value and a setter trigger. */
function Probe({
  value,
  defaultValue = "a",
  onChange,
}: {
  value?: string | undefined;
  defaultValue?: string;
  onChange?: (v: string) => void;
}) {
  const [v, set] = useControllableState(value, defaultValue, onChange);
  return (
    <div>
      <output data-testid="value">{v}</output>
      <button type="button" onClick={() => set("b")}>
        set b
      </button>
    </div>
  );
}

const meta = {
  title: "OCTANT/Hooks/useControllableState",
  component: Probe,
  args: { onChange: fn() },
} satisfies Meta<typeof Probe>;
export default meta;
type Story = StoryObj<typeof meta>;

/** Uncontrolled (no `value` prop): `set` updates the internal state AND calls `onChange`. */
export const Uncontrolled: Story = {
  play: async ({ canvas, userEvent, args }) => {
    await expect(canvas.getByTestId("value")).toHaveTextContent("a");
    await userEvent.click(canvas.getByRole("button", { name: "set b" }));
    await waitFor(() => expect(canvas.getByTestId("value")).toHaveTextContent("b"));
    await expect(args.onChange).toHaveBeenCalledWith("b");
  },
};

/** Controlled (`value` fixed by the parent): `set` only calls `onChange` — the rendered value never moves on its own. */
export const Controlled: Story = {
  args: { value: "a" },
  play: async ({ canvas, userEvent, args }) => {
    await expect(canvas.getByTestId("value")).toHaveTextContent("a");
    await userEvent.click(canvas.getByRole("button", { name: "set b" }));
    await expect(args.onChange).toHaveBeenCalledWith("b");
    // No re-render with a new `value` happened, so the output stays "a".
    await expect(canvas.getByTestId("value")).toHaveTextContent("a");
  },
};

/** Full controlled loop: a stateful wrapper feeds `onChange` back into `value`, so the click DOES flow through. */
export const ControlledRerender: Story = {
  render: (args) => {
    function Wrapper() {
      const [value, setValue] = useState("a");
      return (
        <Probe
          {...args}
          value={value}
          onChange={(next) => {
            setValue(next);
            args.onChange?.(next);
          }}
        />
      );
    }
    return <Wrapper />;
  },
  play: async ({ canvas, userEvent, args }) => {
    await expect(canvas.getByTestId("value")).toHaveTextContent("a");
    await userEvent.click(canvas.getByRole("button", { name: "set b" }));
    await waitFor(() => expect(canvas.getByTestId("value")).toHaveTextContent("b"));
    await expect(args.onChange).toHaveBeenCalledWith("b");
  },
};

/** `value={undefined}` explicitly is indistinguishable from omitting it — the hook falls back to uncontrolled. */
export const UndefinedMeansUncontrolled: Story = {
  args: { value: undefined },
  play: async ({ canvas, userEvent, args }) => {
    await expect(canvas.getByTestId("value")).toHaveTextContent("a");
    await userEvent.click(canvas.getByRole("button", { name: "set b" }));
    await waitFor(() => expect(canvas.getByTestId("value")).toHaveTextContent("b"));
    await expect(args.onChange).toHaveBeenCalledWith("b");
  },
};
