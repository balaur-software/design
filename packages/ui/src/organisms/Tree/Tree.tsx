import {
  type CSSProperties,
  type PointerEvent,
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import { useCollapse } from "../../hooks/useCollapse";
import { useReducedMotion } from "../../hooks/useReducedMotion";

export interface TreeNode {
  /** Row label. */
  label: string;
  /** Child nodes. Their presence marks this node as a folder. */
  children?: TreeNode[];
  /** Leading glyph. Folders default to ■; files default to a quadrant block. */
  glyph?: string;
  /** Start collapsed (folders only). Defaults to expanded. */
  defaultCollapsed?: boolean;
}

export interface TreeProps {
  /** The top-level nodes. Nest via each node's `children`. */
  nodes: TreeNode[];
  /** Accessible name for the tree. */
  "aria-label"?: string;
  style?: CSSProperties;
}

const EASE = "cubic-bezier(.5,0,.2,1)";
const INDENT = 18;
const HOVER = "#0f1014";

/** Files sit 8px further in than a folder at the same depth (the caret's width). */
function padLeft(depth: number, folder: boolean): number {
  return 10 + depth * INDENT + (folder ? 0 : 8);
}

const rowBase: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  padding: "6px 8px",
};

interface FlatNode {
  /** Stable path id (prefix + index + label). */
  id: string;
  label: string;
  glyph: string | undefined;
  depth: number;
  folder: boolean;
  open: boolean;
  /** Stable id of the parent folder, or null at the root. */
  parentId: string | null;
}

/** Walk the node tree into a flat, visible-only list (descends into open folders only). */
function flatten(
  nodes: TreeNode[],
  collapsed: Set<string>,
  depth: number,
  prefix: string,
  parentId: string | null,
  out: FlatNode[],
): void {
  nodes.forEach((node, i) => {
    const id = `${prefix}/${i}:${node.label}${node.children ? "/" : ""}`;
    const folder = !!node.children;
    const open = folder && !collapsed.has(id);
    out.push({ id, label: node.label, glyph: node.glyph, depth, folder, open, parentId });
    if (folder && open) flatten(node.children ?? [], collapsed, depth + 1, id, id, out);
  });
}

/** Seed the collapsed set from nodes flagged `defaultCollapsed` (recursively). */
function seedCollapsed(nodes: TreeNode[], prefix: string, out: Set<string>): void {
  nodes.forEach((node, i) => {
    if (node.children) {
      const id = `${prefix}/${i}:${node.label}/`;
      if (node.defaultCollapsed) out.add(id);
      seedCollapsed(node.children, id, out);
    }
  });
}

function FileRow({
  node,
  depth,
  id,
  focused,
  onFocus,
  register,
}: {
  node: FlatNode;
  depth: number;
  id: string;
  focused: boolean;
  onFocus: (id: string) => void;
  register: (id: string, el: HTMLDivElement | null) => void;
}) {
  return (
    <div
      ref={(el) => register(id, el)}
      role="treeitem"
      aria-level={depth + 1}
      tabIndex={focused ? 0 : -1}
      onFocus={() => onFocus(id)}
      style={{
        ...rowBase,
        paddingLeft: padLeft(depth, false),
        color: "var(--bx-text-4, #9aa0ad)",
      }}
    >
      <span aria-hidden="true" style={{ color: "#5b616e" }}>
        {node.glyph ?? "▞"}
      </span>
      <span>{node.label}</span>
    </div>
  );
}

function TreeFolder({
  node,
  depth,
  open,
  onToggle,
  focused,
  onFocus,
  register,
  reduced,
  children,
}: {
  node: FlatNode;
  depth: number;
  open: boolean;
  onToggle: () => void;
  focused: boolean;
  onFocus: (id: string) => void;
  register: (id: string, el: HTMLDivElement | null) => void;
  reduced: boolean;
  children: React.ReactNode;
}) {
  const bodyRef = useRef<HTMLDivElement>(null);
  useCollapse(bodyRef, open);

  // SSR-correct height: open folders render expanded on the server. The value is
  // frozen at mount so `useCollapse`/`toggle` own max-height imperatively after
  // hydration without React re-writing it on re-renders.
  const [initialOpen] = useState(open);

  // While closed/open, `useCollapse` pins max-height to a pixel value. Once an
  // open panel finishes animating we release it to `none` so nested folders can
  // grow/shrink without being clipped by an ancestor's stale measured height.
  useEffect(() => {
    const el = bodyRef.current;
    if (!el) return;
    if (reduced) el.style.maxHeight = open ? "none" : "0px";
  }, [open, reduced]);

  // `useCollapse` pins an open body to a px height on mount, but no transition
  // fires there to release it — do it ourselves so nested toggles aren't clipped.
  useEffect(() => {
    const el = bodyRef.current;
    if (el && initialOpen) el.style.maxHeight = "none";
  }, []);

  const toggle = () => {
    const el = bodyRef.current;
    // Closing from a released `none` height: re-pin to px first so it animates.
    if (open && el && !reduced) {
      el.style.maxHeight = `${el.scrollHeight}px`;
      void el.offsetHeight; // force reflow
    }
    onToggle();
  };

  const hover = (bg: string) => (e: PointerEvent<HTMLDivElement>) => {
    e.currentTarget.style.background = bg;
  };

  return (
    <>
      <div
        ref={(el) => register(node.id, el)}
        role="treeitem"
        aria-expanded={open}
        aria-level={depth + 1}
        tabIndex={focused ? 0 : -1}
        onFocus={() => onFocus(node.id)}
        onClick={toggle}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " " || e.key === "Spacebar") {
            e.preventDefault();
            toggle();
          }
        }}
        onPointerEnter={hover(HOVER)}
        onPointerLeave={hover("transparent")}
        style={{
          ...rowBase,
          paddingLeft: padLeft(depth, true),
          cursor: "pointer",
          color: "var(--bx-text-3, #c8cdd6)",
          outline: "none",
        }}
      >
        <span
          aria-hidden="true"
          style={{
            color: "var(--bx-accent, #46c66d)",
            display: "inline-block",
            fontSize: 11,
            transform: open ? "rotate(90deg)" : "rotate(0deg)",
            transition: reduced ? "none" : `transform .2s ${EASE}`,
          }}
        >
          ▸
        </span>
        <span aria-hidden="true" style={{ color: "var(--bx-accent, #46c66d)" }}>
          {node.glyph ?? "■"}
        </span>
        <span>{node.label}</span>
      </div>
      <div
        ref={bodyRef}
        role="group"
        onTransitionEnd={(e) => {
          // Ignore transitions bubbling up from descendant folders/carets.
          if (e.target !== e.currentTarget) return;
          if (open && bodyRef.current) bodyRef.current.style.maxHeight = "none";
        }}
        style={{
          maxHeight: initialOpen ? "none" : 0,
          overflow: "hidden",
          transition: reduced ? "none" : `max-height .26s ${EASE}`,
        }}
      >
        {children}
      </div>
    </>
  );
}

/**
 * A collapsible file tree. Folders (nodes with `children`) toggle their subtree
 * on click, rotating a caret 90deg and animating the group open via the shared
 * `useCollapse` max-height transition. Depth drives indentation. The tree
 * follows the WAI-ARIA tree pattern: roving `tabindex` (one focusable row at a
 * time) with ↑/↓ to move, ←/→ to collapse/expand or dive in, Home/End to jump,
 * Enter/Space to toggle a folder. Markup is static so it renders on the server;
 * the disclosure animation runs after mount.
 */
export function Tree({ nodes, "aria-label": ariaLabel, style }: TreeProps) {
  const reduced = useReducedMotion();
  const baseId = useId();
  const [collapsed, setCollapsed] = useState<Set<string>>(() => {
    const out = new Set<string>();
    seedCollapsed(nodes, baseId, out);
    return out;
  });
  const [focusId, setFocusId] = useState<string | null>(null);
  const itemMap = useRef<Map<string, HTMLDivElement>>(new Map());

  const flat = useMemo(() => {
    const out: FlatNode[] = [];
    flatten(nodes, collapsed, 0, baseId, null, out);
    return out;
  }, [nodes, collapsed, baseId]);

  // Roving tabindex: before any interaction the first visible row is the tab
  // stop, so the tree is reachable by keyboard (APG: exactly one treeitem with
  // tabindex=0 at all times).
  const effectiveFocusId = focusId ?? flat[0]?.id ?? null;

  const register = useCallback((id: string, el: HTMLDivElement | null) => {
    if (el) itemMap.current.set(id, el);
    else itemMap.current.delete(id);
  }, []);

  const focus = useCallback((id: string) => {
    setFocusId(id);
    // Focus on next paint so the freshly-mounted row (after expand) is in the DOM.
    requestAnimationFrame(() => itemMap.current.get(id)?.focus());
  }, []);

  const toggle = useCallback((id: string) => {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const onTreeKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (flat.length === 0) return;
    const currentIdx = effectiveFocusId ? flat.findIndex((n) => n.id === effectiveFocusId) : -1;
    const cur = currentIdx >= 0 ? flat[currentIdx] : null;
    const clamp = (i: number) => Math.max(0, Math.min(flat.length - 1, i));

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        focus(flat[clamp(currentIdx < 0 ? 0 : currentIdx + 1)]!.id);
        break;
      case "ArrowUp":
        e.preventDefault();
        focus(flat[clamp(currentIdx <= 0 ? flat.length - 1 : currentIdx - 1)]!.id);
        break;
      case "Home":
        e.preventDefault();
        focus(flat[0]!.id);
        break;
      case "End":
        e.preventDefault();
        focus(flat[flat.length - 1]!.id);
        break;
      case "ArrowRight":
        e.preventDefault();
        if (cur?.folder && !cur.open) {
          toggle(cur.id);
        } else if (cur?.folder && cur.open) {
          // Move to first child (the next visible row, if it's a descendant).
          const child = flat[currentIdx + 1];
          if (child && child.parentId === cur.id) focus(child.id);
        }
        break;
      case "ArrowLeft":
        e.preventDefault();
        if (cur?.folder && cur.open) {
          toggle(cur.id);
        } else if (cur?.parentId) {
          focus(cur.parentId);
        }
        break;
      default:
        break;
    }
  };

  // Render the nested structure, threading focus + open state down. We walk the
  // flat list to preserve order while emitting nested `role="group"` wrappers.
  const renderRange = (
    start: number,
    parentId: string | null,
  ): { next: number; nodes: React.ReactNode[] } => {
    const out: React.ReactNode[] = [];
    let i = start;
    while (i < flat.length) {
      const node = flat[i]!;
      if (node.parentId !== parentId) break;
      if (node.folder) {
        const child = renderRange(i + 1, node.id);
        out.push(
          <TreeFolder
            key={node.id}
            node={node}
            depth={node.depth}
            open={node.open}
            onToggle={() => toggle(node.id)}
            focused={effectiveFocusId === node.id}
            onFocus={focus}
            register={register}
            reduced={reduced}
          >
            {child.nodes}
          </TreeFolder>,
        );
        i = child.next;
      } else {
        out.push(
          <FileRow
            key={node.id}
            node={node}
            depth={node.depth}
            id={node.id}
            focused={effectiveFocusId === node.id}
            onFocus={focus}
            register={register}
          />,
        );
        i++;
      }
    }
    return { next: i, nodes: out };
  };

  const rendered = renderRange(0, null).nodes;

  return (
    <div
      role="tree"
      aria-label={ariaLabel}
      onKeyDown={onTreeKeyDown}
      style={{
        fontSize: 13,
        fontFamily: "var(--bx-font-mono, 'DepartureMono', ui-monospace, monospace)",
        ...style,
      }}
    >
      {rendered}
    </div>
  );
}
