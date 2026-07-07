import { type CSSProperties, Fragment, type MouseEvent } from "react";

export interface BreadcrumbPathItem {
  id: string;
  title: string;
  type?: string;
}

export interface BreadcrumbPathProps {
  /** Ordered path segments, root first. The last item is the current node. */
  path: readonly BreadcrumbPathItem[];
  /** Called for the root + every non-final segment. */
  onNavigate?: (id: string) => void;
  style?: CSSProperties;
}

const link: CSSProperties = { color: "#7b8290", cursor: "pointer", textDecoration: "none" };
const current: CSSProperties = { color: "var(--bx-accent, #46c66d)" };
const sep: CSSProperties = { color: "#3f424d" };

/**
 * A node-title breadcrumb for the memory explorer: `MEMORY ▸ type ▸ title`,
 * mirroring the shared `Breadcrumb`'s visual language but routing by node id
 * through `onNavigate` (the shared component has no per-segment click hook).
 * The final segment is the current location (accent); the rest are clickable.
 */
export function BreadcrumbPath({ path, onNavigate, style }: BreadcrumbPathProps) {
  const segments: { id: string | null; label: string }[] = [
    { id: null, label: "MEMORY" },
    ...path.map((p) => ({ id: p.id, label: p.title })),
  ];
  const last = segments.length - 1;

  const onClick = (e: MouseEvent, id: string | null) => {
    if (!onNavigate || id === null) return;
    e.preventDefault();
    onNavigate(id);
  };

  return (
    <nav
      aria-label="Memory breadcrumb"
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        fontSize: 13,
        flexWrap: "wrap",
        fontFamily: "var(--bx-font-mono, 'DepartureMono', ui-monospace, monospace)",
        ...style,
      }}
    >
      {segments.map((s, i) => {
        const isCurrent = i === last;
        const clickable = !isCurrent && onNavigate !== undefined && s.id !== null;
        return (
          <Fragment key={`${s.label}-${i}`}>
            {isCurrent ? (
              <span aria-current="page" style={current}>
                {s.label}
              </span>
            ) : (
              <a
                href={clickable ? "#" : undefined}
                onClick={clickable ? (e) => onClick(e, s.id) : undefined}
                style={{ ...link, cursor: clickable ? "pointer" : "default" }}
              >
                {s.label}
              </a>
            )}
            {!isCurrent && (
              <span aria-hidden="true" style={sep}>
                ▸
              </span>
            )}
          </Fragment>
        );
      })}
    </nav>
  );
}
