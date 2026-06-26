import { useEffect, useMemo, useState } from 'react';
import { DiffRow, type DiffApi } from './DiffRow';
import type { DiffNode } from '../utils/jsonDiff';

interface DiffTreeProps {
  root: DiffNode;
  expandLevel: number;
  onlyDiff: boolean;
  parseAll: boolean;
  onToggleNested: (path: string) => void;
}

export function DiffTree({
  root,
  expandLevel,
  onlyDiff,
  parseAll,
  onToggleNested,
}: DiffTreeProps) {
  const [expandedOverride, setExpandedOverride] = useState<
    Map<string, boolean>
  >(new Map());

  // Reset overrides only when the expand level changes (re-apply depth defaults).
  // We intentionally do NOT key this on `root`: expand-override keys are stable
  // JSON Pointers, so persisting them across diff recomputes (e.g. a single
  // nested-parse toggle) preserves the user's expand/collapse state. Stale paths
  // from a previous input simply never match and are harmless.
  useEffect(() => {
    setExpandedOverride(new Map());
  }, [expandLevel]);

  const api: DiffApi = useMemo(
    () => ({
      isExpanded: (path: string, depth: number) => {
        const v = expandedOverride.get(path);
        return v !== undefined ? v : depth < expandLevel;
      },
      toggleExpanded: (path: string, depth: number) => {
        setExpandedOverride((prev) => {
          const next = new Map(prev);
          const current = prev.get(path) ?? depth < expandLevel;
          next.set(path, !current);
          return next;
        });
      },
      onlyDiff,
      parseAll,
      onToggleNested,
    }),
    [expandedOverride, expandLevel, onlyDiff, parseAll, onToggleNested]
  );

  return (
    <div className="diff-grid">
      <DiffRow node={root} depth={0} api={api} />
    </div>
  );
}
