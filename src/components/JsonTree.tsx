import { useEffect, useMemo, useState } from 'react';
import { JsonNode, type TreeApi } from './JsonNode';

interface JsonTreeProps {
  value: unknown;
  expandLevel: number;
  onOpenValue: (text: string, title?: string) => void;
}

export function JsonTree({ value, expandLevel, onOpenValue }: JsonTreeProps) {
  const [expandedOverride, setExpandedOverride] = useState<
    Map<string, boolean>
  >(new Map());
  const [nestedParsed, setNestedParsed] = useState<Set<string>>(new Set());
  const [unescaped, setUnescaped] = useState<Set<string>>(new Set());

  useEffect(() => {
    setExpandedOverride(new Map());
  }, [expandLevel]);

  useEffect(() => {
    setExpandedOverride(new Map());
    setNestedParsed(new Set());
    setUnescaped(new Set());
  }, [value]);

  const api: TreeApi = useMemo(
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
      isNested: (path: string) => nestedParsed.has(path),
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
    }),
    [expandedOverride, nestedParsed, unescaped, expandLevel, onOpenValue]
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
