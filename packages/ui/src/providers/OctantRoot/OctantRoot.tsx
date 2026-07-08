import type { CSSProperties, ReactNode } from "react";
import type { AccentName } from "../../../../tokens/src/index.ts";
import { ToastProvider } from "../../primitives/ToastProvider.tsx";
import { AccentProvider } from "../AccentProvider/AccentProvider.tsx";

export interface OctantRootProps {
  /** Accent name ("green" | "amber" | "cyan") or any hex; forwarded to AccentProvider. Default "green". */
  accent?: AccentName | string;
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
}

/**
 * The one-stop app-root provider: composes `AccentProvider` (outer) around
 * `ToastProvider` (inner) so hosts get the correct wiring without hand-rolling
 * the recipe. The order is load-bearing: `ToastProvider` renders its toast
 * stack as a DOM sibling of `{children}`, so the stack only inherits the
 * chosen accent when it sits inside `AccentProvider`'s wrapper div.
 *
 * Does NOT import `tokens.css` — the stylesheet stays an explicit, separate
 * host step (`import "@balaur/octant/tokens/tokens.css"`), because no-bundler
 * SSR hosts deliver CSS outside the component tree. `AccentProvider` and
 * `ToastProvider` remain exported for standalone subtree use; `OctantRoot` is
 * pure sugar over their correct nesting.
 */
export function OctantRoot({ accent = "green", children, className, style }: OctantRootProps) {
  return (
    <AccentProvider
      accent={accent}
      {...(className !== undefined ? { className } : {})}
      {...(style !== undefined ? { style } : {})}
    >
      <ToastProvider>{children}</ToastProvider>
    </AccentProvider>
  );
}
