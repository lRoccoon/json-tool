import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { JsonNode, type TreeApi } from './JsonNode';
import type { SearchScope, SortKeysMode } from '../utils/jsonUtils';

interface JsonTreeProps {
  value: unknown;
  expandLevel: number;
  onOpenValue: (text: string, title?: string) => void;
  searchQuery: string;
  searchScope: SearchScope;
  searchMatches: string[];
  searchAncestors: Set<string>;
  searchCurrentIndex: number;
  sortKeys: SortKeysMode;
}

export function JsonTree({
  value,
  expandLevel,
  onOpenValue,
  searchQuery,
  searchScope,
  searchMatches,
  searchAncestors,
  searchCurrentIndex,
  sortKeys,
}: JsonTreeProps) {
  const [expandedOverride, setExpandedOverride] = useState<
    Map<string, boolean>
  >(new Map());
  const [nestedParsed, setNestedParsed] = useState<Set<string>>(new Set());
  const [unescaped, setUnescaped] = useState<Set<string>>(new Set());
  const nodeRefs = useRef<Map<string, HTMLElement>>(new Map());

  useEffect(() => {
    setExpandedOverride(new Map());
  }, [expandLevel]);

  useEffect(() => {
    setExpandedOverride(new Map());
    setNestedParsed(new Set());
    setUnescaped(new Set());
  }, [value]);

  const currentPath = searchMatches[searchCurrentIndex] ?? null;

  useEffect(() => {
    if (!currentPath) return;
    const el = nodeRefs.current.get(currentPath);
    if (!el) return;
    const target = el.querySelector('.jn-mark-current') ?? el;
    (target as HTMLElement).scrollIntoView({
      block: 'center',
      inline: 'center',
      behavior: 'smooth',
    });
  }, [currentPath]);

  const registerNode = useCallback(
    (path: string, el: HTMLElement | null) => {
      if (el) nodeRefs.current.set(path, el);
      else nodeRefs.current.delete(path);
    },
    []
  );

  const api: TreeApi = useMemo(
    () => ({
      isExpanded: (path: string, depth: number) => {
        if (searchAncestors.has(path)) return true;
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
      isNested: (path: string) =>
        nestedParsed.has(path) || searchAncestors.has(path),
      toggleNested: (path: string) => {
        setNestedParsed((prev) => {
          const next = new Set(prev);
          if (next.has(path)) next.delete(path);
          else next.add(path);
          return next;
        });
      },
      isUnescaped: (path: string) => unescaped.has(path),
      toggleUnescaped: (path: string) => {
        setUnescaped((prev) => {
          const next = new Set(prev);
          if (next.has(path)) next.delete(path);
          else next.add(path);
          return next;
        });
      },
      onOpenValue,
      sortKeys,
      search: {
        query: searchQuery,
        scope: searchScope,
        currentPath,
        registerNode,
      },
    }),
    [
      expandedOverride,
      nestedParsed,
      unescaped,
      expandLevel,
      onOpenValue,
      searchAncestors,
      searchQuery,
      searchScope,
      currentPath,
      registerNode,
      sortKeys,
    ]
  );

  return (
    <div className="json-tree">
      <JsonNode
        value={value}
        keyLabel={null}
        path=""
        depth={0}
        api={api}
        isArrayItem={false}
      />
    </div>
  );
}
