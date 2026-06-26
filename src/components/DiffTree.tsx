import { useEffect, useMemo, useState } from 'react';
import { DiffRow, type DiffApi } from './DiffRow';
import type { DiffNode } from '../utils/jsonDiff';

interface DiffTreeProps {
  root: DiffNode;
  expandLevel: number;
  onlyDiff: boolean;
  onToggleNested: (path: string) => void;
}

export function DiffTree({
  root,
  expandLevel,
  onlyDiff,
  onToggleNested,
}: DiffTreeProps) {
  const [expandedOverride, setExpandedOverride] = useState<
    Map<string, boolean>
  >(new Map());

  useEffect(() => {
    setExpandedOverride(new Map());
  }, [expandLevel, root]);

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
      onToggleNested,
    }),
    [expandedOverride, expandLevel, onlyDiff, onToggleNested]
  );

  return (
    <div className="diff-grid">
      <DiffRow node={root} depth={0} api={api} />
    </div>
  );
}
