import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn } from "storybook/test";
import { RadioGroup } from "./RadioGroup.tsx";

const DITHER = [
  { value: "bayer", label: "BAYER 4×4 — ordered" },
  { value: "floyd", label: "FLOYD–STEINBERG — error diffuse" },
  { value: "threshold", label: "THRESHOLD — hard cut" },
];

const meta = {
  title: "OCTANT/Molecules/RadioGroup",
  component: RadioGroup,
  args: { options: DITHER, "aria-label": "Dither mode", onChange: fn() },
  argTypes: {
    options: { control: "object", description: "Selectable options: { value, label, disabled? }." },
    value: { control: "text", description: "Controlled selected value." },
    defaultValue: { control: "text" },
    fillColor: { control: "color" },
    disabled: { control: "boolean" },
    "aria-label": { control: "text" },
  },
} satisfies Meta<typeof RadioGroup>;
export default meta;
type Story = StoryObj<typeof meta>;

/** First option selected; click or arrow keys move the octant-box fill. */
export const Default: Story = {
  args: { defaultValue: "bayer" },
  play: async ({ canvas, userEvent, args }) => {
    const floyd = canvas.getByRole("radio", { name: /floyd/i });
    await userEvent.click(floyd);
    await expect(floyd).toHaveAttribute("aria-checked", "true");
    await expect(args.onChange).toHaveBeenCalledWith("floyd");
    await userEvent.keyboard("{ArrowDown}");
    const threshold = canvas.getByRole("radio", { name: /threshold/i });
    await expect(threshold).toHaveAttribute("aria-checked", "true");
    await expect(threshold).toHaveFocus();
    await expect(args.onChange).toHaveBeenLastCalledWith("threshold");
  },
};

export const SecondSelected: Story = { args: { defaultValue: "floyd" } };

/** A disabled option is skipped by arrow-key navigation and ignores clicks. */
export const WithDisabledOption: Story = {
  args: {
    defaultValue: "bayer",
    options: [
      { value: "bayer", label: "BAYER 4×4 — ordered" },
      { value: "floyd", label: "FLOYD–STEINBERG — error diffuse" },
      { value: "threshold", label: "THRESHOLD — locked", disabled: true },
    ],
  },
};

export const DisabledGroup: Story = { args: { defaultValue: "floyd", disabled: true } };

/** A custom eighth-block fill colour. */
export const MagentaFill: Story = {
  args: { defaultValue: "threshold", fillColor: "#c26cd0" },
};
