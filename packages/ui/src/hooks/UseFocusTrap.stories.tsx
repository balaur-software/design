import type { Meta, StoryObj } from "@storybook/react-vite";
import type { ReactNode } from "react";
import { useRef, useState } from "react";
import { expect, waitFor } from "storybook/test";
import { useFocusTrap } from "./useFocusTrap";

/**
 * Minimal fixture: an "open" trigger (the focus-restore anchor), a "close"
 * trigger (always rendered, outside the trapped region), and a trapped
 * region that mounts only while active. `children` lets each story control
 * how many focusable descendants the trap sees.
 */
function Probe({ children }: { children?: ReactNode }) {
  const [active, setActive] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useFocusTrap(ref, active);
  return (
    <div>
      <button type="button" onClick={() => setActive(true)}>
        open
      </button>
      <button type="button" onClick={() => setActive(false)}>
        close
      </button>
      {active && (
        <div ref={ref} data-testid="trap">
          {children ?? "trapped content"}
        </div>
      )}
    </div>
  );
}

const twoButtons = (
  <>
    <button type="button">first</button>
    <button type="button">second</button>
  </>
);

const meta = {
  title: "OCTANT/Hooks/useFocusTrap",
  component: Probe,
} satisfies Meta<typeof Probe>;
export default meta;
type Story = StoryObj<typeof meta>;

/** On activation, focus moves to the first focusable descendant of the trapped region. */
export const FocusFirstOnActivate: Story = {
  args: { children: twoButtons },
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole("button", { name: "open" }));
    await waitFor(() => expect(canvas.getByRole("button", { name: "first" })).toHaveFocus());
  },
};

/** Tab from the last focusable wraps back to the first. */
export const WrapsForward: Story = {
  args: { children: twoButtons },
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole("button", { name: "open" }));
    const last = canvas.getByRole("button", { name: "second" });
    await userEvent.click(last);
    await waitFor(() => expect(last).toHaveFocus());
    await userEvent.tab();
    await waitFor(() => expect(canvas.getByRole("button", { name: "first" })).toHaveFocus());
  },
};

/** Shift+Tab from the first focusable wraps back to the last. */
export const WrapsBackward: Story = {
  args: { children: twoButtons },
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole("button", { name: "open" }));
    await waitFor(() => expect(canvas.getByRole("button", { name: "first" })).toHaveFocus());
    await userEvent.tab({ shift: true });
    await waitFor(() => expect(canvas.getByRole("button", { name: "second" })).toHaveFocus());
  },
};

/** No focusable descendants: the container itself gets `tabindex="-1"` and receives focus. */
export const NoFocusablesFallsBackToContainer: Story = {
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole("button", { name: "open" }));
    const trap = canvas.getByTestId("trap");
    await waitFor(() => expect(trap).toHaveFocus());
    await expect(trap).toHaveAttribute("tabindex", "-1");
  },
};

/** Deactivating restores focus to whatever was focused right before the trap activated. */
export const RestoresFocusOnDeactivate: Story = {
  play: async ({ canvas, userEvent }) => {
    const openButton = canvas.getByRole("button", { name: "open" });
    await userEvent.click(openButton);
    await waitFor(() => expect(canvas.getByTestId("trap")).toHaveFocus());
    await userEvent.click(canvas.getByRole("button", { name: "close" }));
    await waitFor(() => expect(openButton).toHaveFocus());
  },
};
