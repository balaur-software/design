import { useCallback, useState } from "react";

export interface UseGraphSelectionResult {
  selectedId: string | null;
  hoveredId: string | null;
  pinnedIds: ReadonlySet<string>;
  setSelected: (id: string | null) => void;
  setHovered: (id: string | null) => void;
  togglePin: (id: string) => void;
  isPinned: (id: string) => boolean;
  clear: () => void;
}

/**
 * Selection / hover / pin state for the memory graph. Pure React state — no
 * effects. Pinning is an independent set from selection: a node can be pinned
 * (held still in the force layout) without being the active selection.
 */
export function useGraphSelection(initial?: { selectedId?: string }): UseGraphSelectionResult {
  const [selectedId, setSelectedId] = useState<string | null>(initial?.selectedId ?? null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [pinnedIds, setPinnedIds] = useState<ReadonlySet<string>>(() => new Set());

  const setSelected = useCallback((id: string | null) => setSelectedId(id), []);
  const setHovered = useCallback((id: string | null) => setHoveredId(id), []);
  const togglePin = useCallback((id: string) => {
    setPinnedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);
  const isPinned = useCallback((id: string) => pinnedIds.has(id), [pinnedIds]);
  const clear = useCallback(() => {
    setSelectedId(null);
    setHoveredId(null);
    setPinnedIds(new Set());
  }, []);

  return { selectedId, hoveredId, pinnedIds, setSelected, setHovered, togglePin, isPinned, clear };
}
