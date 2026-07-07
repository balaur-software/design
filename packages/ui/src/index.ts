/**
 * `@balaur/ui` — the OCTANT design system as atomic React components, plus the
 * shared hooks and primitives they compose from.
 *
 * Components are organised by atomic design level:
 *   - `atoms/`       — smallest single-purpose units (buttons, badges, avatars…)
 *   - `molecules/`   — small functional units (fields, dropdowns, tooltips…)
 *   - `organisms/`   — complex stateful compositions (tables, dialogs, nav…)
 *   - `providers/`   — context providers (accent theme)
 *   - `primitives/`  — low-level building blocks (scrim, floating panel, toasts)
 *   - `hooks/`       — shared React hooks
 *
 * Import the token stylesheet once at your app/root:
 *   import "@balaur/tokens/tokens.css";
 */

export * from "./atoms";
export * from "./ComponentCatalog/ComponentCatalog";
export * from "./hooks";
export * from "./molecules";
export * from "./organisms";
export * from "./primitives";
export * from "./providers";
