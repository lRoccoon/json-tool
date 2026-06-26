import type { CSSProperties, ReactNode } from 'react';
import { isLikelyJsonString, type JsonValue } from '../utils/jsonUtils';
import type { DiffNode } from '../utils/jsonDiff';

export interface DiffApi {
  isExpanded: (path: string, depth: number) => boolean;
  toggleExpanded: (path: string, depth: number) => void;
  onlyDiff: boolean;
  onToggleNested: (path: string) => void;
}

const INDENT = 16;

function keyLabel(key: DiffNode['key']): ReactNode {
  if (key === null) return null;
  if (typeof key === 'number') {
    return <span className="diff-key diff-index">{key}: </span>;
  }
  return <span className="diff-key">"{key}": </span>;
}

function renderValue(value: JsonValue): ReactNode {
  if (value !== null && typeof value === 'object') {
    return <pre className="diff-block">{JSON.stringify(value, null, 2)}</pre>;
  }
  return <span className="diff-scalar">{JSON.stringify(value)}</span>;
}

export function DiffRow({
  node,
  depth,
  api,
}: {
  node: DiffNode;
  depth: number;
  api: DiffApi;
}) {
  const indent: CSSProperties = { paddingLeft: depth * INDENT + 8 };
  const isContainer =
    !!node.children &&
    (node.status === 'children' || node.status === 'unchanged');

  if (isContainer) {
    const children = node.children as DiffNode[];
    const expanded = api.isExpanded(node.path, depth);
    const open = node.kind === 'array' ? '[' : '{';
    const close = node.kind === 'array' ? ']' : '}';
    const unit = node.kind === 'array' ? 'items' : 'keys';
    const visible = api.onlyDiff
      ? children.filter((c) => c.status !== 'unchanged')
      : children;

    const head = (
      <>
        <button
          className="diff-toggle"
          onClick={() => api.toggleExpanded(node.path, depth)}
          aria-label={expanded ? '折叠' : '展开'}
        >
          {expanded ? '▾' : '▸'}
        </button>
        {keyLabel(node.key)}
        <span className="diff-punct">{open}</span>
        {!expanded && (
          <span className="diff-summary">
            {' '}
            {visible.length} {unit} {close}
          </span>
        )}
        {node.nestedParsed && <span className="diff-badge">nested</span>}
      </>
    );

    return (
      <>
        <div className="diff-cell diff-side-left" style={indent}>
          {head}
          {node.nestedParsed && (
            <button
              className="diff-act"
              onClick={() => api.onToggleNested(node.path)}
              title="折叠嵌套 JSON"
            >
              折叠嵌套
            </button>
          )}
        </div>
        <div className="diff-cell diff-side-right" style={indent}>
          {head}
        </div>
        {expanded && (
          <>
            {visible.map((c) => (
              <DiffRow key={c.path} node={c} depth={depth + 1} api={api} />
            ))}
            <div className="diff-cell diff-side-left" style={indent}>
              <span className="diff-punct">{close}</span>
            </div>
            <div className="diff-cell diff-side-right" style={indent}>
              <span className="diff-punct">{close}</span>
            </div>
          </>
        )}
      </>
    );
  }

  const leftHas = node.status !== 'added';
  const rightHas = node.status !== 'removed';
  const leftClass =
    node.status === 'removed' || node.status === 'changed' ? ' is-del' : '';
  const rightClass =
    node.status === 'added' || node.status === 'changed' ? ' is-add' : '';
  const nestable =
    node.status === 'changed' &&
    typeof node.left === 'string' &&
    typeof node.right === 'string' &&
    isLikelyJsonString(node.left) &&
    isLikelyJsonString(node.right);

  return (
    <>
      <div className={`diff-cell diff-side-left${leftClass}`} style={indent}>
        {leftHas && (
          <>
            <span className="diff-gutter">{leftClass ? '-' : ''}</span>
            {keyLabel(node.key)}
            {renderValue(node.left as JsonValue)}
            {nestable && (
              <button
                className="diff-act"
                onClick={() => api.onToggleNested(node.path)}
                title="将该字符串作为 JSON 展开比较"
              >
                嵌套解析
              </button>
            )}
          </>
        )}
      </div>
      <div className={`diff-cell diff-side-right${rightClass}`} style={indent}>
        {rightHas && (
          <>
            <span className="diff-gutter">{rightClass ? '+' : ''}</span>
            {keyLabel(node.key)}
            {renderValue(node.right as JsonValue)}
          </>
        )}
      </div>
    </>
  );
}
