import type { CSSProperties, ReactNode } from "react";

export interface DoctorReportProps {
  readonly activeCount: number;
  readonly pendingCount: number;
  readonly acceptRate30d: number | null;
  readonly deadWeightCandidates: number;
  readonly staleCandidates: number;
  readonly duplicateCandidates: number;
  readonly dueCandidates: number;
  readonly queueOldestDays: number | null;
  /** PRAGMA integrity_check on the record — the health of the FILE itself. */
  readonly integrityOk: boolean;
}

export interface DoctorStripProps {
  report: DoctorReportProps;
  /** Click a metric to surface its candidates (the host's drill-down). */
  onMetricClick?: (key: DoctorMetricKey) => void;
  style?: CSSProperties;
}

export type DoctorMetricKey =
  | "active"
  | "pending"
  | "queueOldest"
  | "acceptRate"
  | "due"
  | "deadWeight"
  | "stale"
  | "duplicates"
  | "integrity";

/** A compact health strip mirroring `Store.doctor()` — reports, never acts. */
export function DoctorStrip({ report, onMetricClick, style }: DoctorStripProps) {
  const pct = report.acceptRate30d === null ? "—" : `${Math.round(report.acceptRate30d * 100)}%`;
  const queueOldest = report.queueOldestDays === null ? "—" : `${report.queueOldestDays}d`;

  const cell = (key: DoctorMetricKey, label: string, value: ReactNode, tone?: string): ReactNode => {
    const color = tone ?? "var(--bx-text-2, #dfe3ea)";
    const cellStyle: CSSProperties = {
      display: "flex",
      flexDirection: "column",
      gap: 2,
      padding: "6px 12px",
      background: "transparent",
      border: 0,
      borderRight: "1px solid var(--bx-border, #1c1d24)",
      color,
      cursor: onMetricClick ? "pointer" : "default",
      fontFamily: "var(--bx-font-mono, 'DepartureMono', ui-monospace, monospace)",
      textAlign: "left",
    };
    const inner = (
      <>
        <span style={{ fontSize: 9, letterSpacing: "0.08em", color: "#5b616e" }}>{label}</span>
        <span style={{ fontSize: 14 }}>{value}</span>
      </>
    );
    // Read-only strips render plain cells — no dead tab stops when there is
    // no drill-down to invoke.
    return onMetricClick ? (
      <button key={key} type="button" onClick={() => onMetricClick(key)} style={cellStyle}>
        {inner}
      </button>
    ) : (
      <div key={key} style={cellStyle}>
        {inner}
      </div>
    );
  };

  return (
    <div
      style={{
        display: "flex",
        alignItems: "stretch",
        flexWrap: "wrap",
        border: "1px solid var(--bx-border, #1c1d24)",
        background: "var(--bx-surface-2, #0b0d10)",
        fontFamily: "var(--bx-font-mono, 'DepartureMono', ui-monospace, monospace)",
        ...style,
      }}
    >
      {cell("active", "ACTIVE", report.activeCount, "var(--bx-accent, #46c66d)")}
      {cell("pending", "PENDING", report.pendingCount, "#f2c94c")}
      {cell("queueOldest", "QUEUE OLDEST", queueOldest)}
      {cell("acceptRate", "ACCEPT 30D", pct)}
      {cell("due", "DUE", report.dueCandidates, "#f2c94c")}
      {cell("deadWeight", "DEAD WEIGHT", report.deadWeightCandidates)}
      {cell("stale", "STALE", report.staleCandidates)}
      {cell("duplicates", "DUPLICATES", report.duplicateCandidates)}
      {cell(
        "integrity",
        "INTEGRITY",
        report.integrityOk ? "OK" : "FAIL",
        report.integrityOk ? "var(--bx-accent, #46c66d)" : "#ff6b6f",
      )}
    </div>
  );
}
