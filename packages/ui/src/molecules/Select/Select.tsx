import { type CSSProperties, useId, useState } from "react";
import { useControllableState } from "../../hooks/useControllableState";
import { FloatingPanel } from "../../primitives";

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps {
  options: SelectOption[];
  /** Controlled selected value. Omit for uncontrolled (use `defaultValue`). */
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  /** Shown on the button when nothing is selected. */
  placeholder?: string;
  disabled?: boolean;
  /** Trigger + panel width. Defaults to 230. */
  width?: CSSProperties["width"];
  /** Accessible name for the select (rendered as aria-label on the trigger). */
  ariaLabel?: string;
  style?: CSSProperties;
}

/**
 * A terminal-styled select: a button that unrolls a floating option menu with a
 * caret that flips (▾ / ▴) and an accent-tinted border while open. Selection is
 * via `useControllableState`; the popup + outside-click/Escape dismissal come
 * from the shared `FloatingPanel` primitive. Static button renders on the server;
 * the menu is inert until opened after mount.
 */
export function Select({
  options,
  value,
  defaultValue,
  onChange,
  placeholder = "SELECT",
  disabled,
  width = 230,
  ariaLabel,
  style,
}: SelectProps) {
  const [selected, setSelected] = useControllableState(value, defaultValue ?? "", onChange);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const baseId = useId();
  const listboxId = `${baseId}-listbox`;

  const current = options.find((o) => o.value === selected);
  const count = options.length;

  const openList = () => {
    if (disabled) return;
    const idx = options.findIndex((o) => o.value === selected);
    setActive(idx >= 0 ? idx : 0);
    setOpen(true);
  };

  const choose = (i: number) => {
    const opt = options[i];
    if (!opt) return;
    setSelected(opt.value);
    setOpen(false);
  };

  const onTriggerKey = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (disabled) return;
    if (e.key === "ArrowDown" || e.key === "Enter" || e.key === " " || e.key === "Spacebar") {
      e.preventDefault();
      if (!open) openList();
      else if (e.key === "Enter" || e.key === " " || e.key === "Spacebar") choose(active);
      else setActive((a) => Math.min(count - 1, a + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (!open) openList();
      else setActive((a) => Math.max(0, a - 1));
    } else if (e.key === "Home") {
      e.preventDefault();
      if (!open) openList();
      else setActive(0);
    } else if (e.key === "End") {
      e.preventDefault();
      if (!open) openList();
      else setActive(count - 1);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  return (
    <FloatingPanel
      open={open && !disabled}
      onOpenChange={setOpen}
      align="start"
      width={width}
      role="listbox"
      panelId={listboxId}
      ariaLabel={ariaLabel}
      panelStyle={{
        background: "var(--bx-surface-3, #0c0d11)",
        border: "1px solid var(--bx-border, #1c1d24)",
        overflow: "hidden",
      }}
      trigger={
        <button
          type="button"
          disabled={disabled}
          role="combobox"
          aria-label={ariaLabel}
          aria-labelledby={ariaLabel ? undefined : `${baseId}-value`}
          aria-haspopup="listbox"
          aria-expanded={open && !disabled}
          aria-controls={open ? listboxId : undefined}
          aria-activedescendant={open && active >= 0 ? `${baseId}-opt-${active}` : undefined}
          onClick={() => (open ? setOpen(false) : openList())}
          onKeyDown={onTriggerKey}
          style={{
            width,
            maxWidth: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 10,
            fontFamily: "inherit",
            fontSize: 13,
            padding: "11px 14px",
            background: "var(--bx-surface-3, #0c0d11)",
            border: `1px solid ${open && !disabled ? "var(--bx-border-accent, #2a3320)" : "var(--bx-border, #1c1d24)"}`,
            color: disabled ? "var(--bx-text-dim-3, #4b505c)" : "var(--bx-text-1, #f4f6fb)",
            cursor: disabled ? "not-allowed" : "pointer",
            letterSpacing: "0.04em",
            transition: "border-color .16s var(--bx-ease, cubic-bezier(.5,0,.2,1))",
            ...style,
          }}
        >
          <span id={`${baseId}-value`}>{current ? current.label : placeholder}</span>
          <span aria-hidden="true" style={{ color: "var(--bx-accent, #46c66d)" }}>
            {open && !disabled ? "▴" : "▾"}
          </span>
        </button>
      }
    >
      <div>
        {options.map((opt, i) => {
          const isSelected = opt.value === selected;
          const isActive = i === active;
          return (
            <button
              key={opt.value}
              id={`${baseId}-opt-${i}`}
              type="button"
              role="option"
              aria-selected={isSelected}
              onClick={() => choose(i)}
              onPointerEnter={() => setActive(i)}
              onPointerMove={() => setActive(i)}
              style={{
                display: "block",
                width: "100%",
                textAlign: "left",
                fontFamily: "inherit",
                fontSize: 13,
                padding: "10px 14px",
                background: isActive ? "#15161e" : "transparent",
                border: 0,
                color: isSelected ? "var(--bx-accent, #46c66d)" : "var(--bx-text-4, #9aa0ad)",
                cursor: "pointer",
                letterSpacing: "0.04em",
              }}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </FloatingPanel>
  );
}
