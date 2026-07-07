import type { CSSProperties } from "react";
import { BrailleSpinner } from "../../atoms/BrailleSpinner/BrailleSpinner";
import type { PlanStep } from "../ChatPanel/chat-types";

const STATUS_GLYPH: Record<PlanStep["status"], string> = {
  pending: "·",
  running: "◐",
  done: "✓",
  error: "✕",
};

const STATUS_COLOR: Record<PlanStep["status"], string> = {
  pending: "var(--bx-text-6, #5b616e)",
  running: "var(--bx-accent, #46c66d)",
  done: "var(--bx-accent, #46c66d)",
  error: "#ff6b6f",
};

export interface AgentPlanProps {
  steps: PlanStep[];
  onStepClick?: (id: string) => void;
  style?: CSSProperties;
}

/**
 * A multi-step plan: ordered steps with `pending`/`running`/`done`/`error`
 * states. The running step is highlighted with an accent rail and a spinner;
 * completed steps show `✓`. Clickable steps fire `onStepClick`. Pure render
 * from the `steps` prop.
 */
export function AgentPlan({ steps, onStepClick, style }: AgentPlanProps) {
  const done = steps.filter((s) => s.status === "done").length;
  return (
    <div
      style={{
        border: "1px solid var(--bx-border, #1c1d24)",
        background: "var(--bx-surface-3, #0c0d11)",
        padding: 14,
        display: "flex",
        flexDirection: "column",
        gap: 2,
        fontFamily: "var(--bx-font-mono, 'DepartureMono', ui-monospace, monospace)",
        ...style,
      }}
    >
      <div
        style={{ color: "var(--bx-text-6, #5b616e)", fontSize: 11, letterSpacing: "0.1em", marginBottom: 10 }}
      >
        PLAN · {done}/{steps.length}
      </div>
      {steps.map((step, i) => {
        const running = step.status === "running";
        const rowStyle: CSSProperties = {
          display: "flex",
          alignItems: "flex-start",
          gap: 10,
          width: "100%",
          textAlign: "left",
          fontFamily: "inherit",
          fontSize: 13,
          padding: "8px 10px",
          background: running ? "var(--bx-surface-2, #15161e)" : "transparent",
          border: 0,
          borderLeft: `2px solid ${running ? "var(--bx-accent, #46c66d)" : "transparent"}`,
          color: step.status === "pending" ? "var(--bx-text-6, #5b616e)" : "var(--bx-text-2, #9aa0ad)",
          cursor: onStepClick ? "pointer" : "default",
        };
        const content = (
          <>
            <span
              style={{
                color: STATUS_COLOR[step.status],
                flex: "none",
                width: 18,
                height: 18,
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {running ? <BrailleSpinner variant="pulse" size={13} /> : STATUS_GLYPH[step.status]}
            </span>
            <span style={{ flex: 1 }}>
              <span style={{ color: "var(--bx-text-6, #5b616e)", marginRight: 6 }}>
                {String(i + 1).padStart(2, "0")}
              </span>
              {step.label}
              {step.detail && (
                <span
                  style={{ display: "block", color: "var(--bx-text-6, #5b616e)", fontSize: 11, marginTop: 3 }}
                >
                  {step.detail}
                </span>
              )}
            </span>
          </>
        );
        // Steps are buttons only when they actually do something; otherwise a
        // plain row, so keyboard users get no dead tab stops.
        return onStepClick ? (
          <button key={step.id} type="button" onClick={() => onStepClick(step.id)} style={rowStyle}>
            {content}
          </button>
        ) : (
          <div key={step.id} style={rowStyle}>
            {content}
          </div>
        );
      })}
    </div>
  );
}
