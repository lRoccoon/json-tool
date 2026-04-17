import { useState } from 'react';
import {
  isLikelyJsonString,
  tryParseJson,
  unescapeString,
} from '../utils/jsonUtils';

export interface TreeApi {
  isExpanded: (path: string, depth: number) => boolean;
  toggleExpanded: (path: string, depth: number) => void;
  isNested: (path: string) => boolean;
  toggleNested: (path: string) => void;
  isUnescaped: (path: string) => boolean;
  toggleUnescaped: (path: string) => void;
  onOpenValue: (text: string, title?: string) => void;
}

interface JsonNodeProps {
  value: unknown;
  keyLabel: string | number | null;
  path: string;
  depth: number;
  api: TreeApi;
  isArrayItem: boolean;
}

const LONG_VALUE_THRESHOLD = 120;

export function JsonNode(props: JsonNodeProps) {
  const { value, api, path } = props;

  let effectiveValue: unknown = value;
  let isNestedView = false;
  if (typeof value === 'string' && api.isNested(path)) {
    const res = tryParseJson(value);
    if (res.ok && res.value !== null && typeof res.value === 'object') {
      effectiveValue = res.value;
      isNestedView = true;
    }
  }

  const isArr = Array.isArray(effectiveValue);
  const isObj =
    !isArr && effectiveValue !== null && typeof effectiveValue === 'object';

  if (isArr || isObj) {
    return (
      <ContainerNode
        {...props}
        effectiveValue={effectiveValue}
        isArr={isArr}
        isNestedView={isNestedView}
        rawValue={value}
      />
    );
  }

  return <PrimitiveNode {...props} />;
}

interface ContainerNodeProps extends JsonNodeProps {
  effectiveValue: unknown;
  isArr: boolean;
  isNestedView: boolean;
  rawValue: unknown;
}

function ContainerNode({
  effectiveValue,
  isArr,
  isNestedView,
  rawValue,
  keyLabel,
  path,
  depth,
  api,
}: ContainerNodeProps) {
  const [copied, setCopied] = useState(false);
  const expanded = api.isExpanded(path, depth);

  const entries: [string | number, unknown][] = isArr
    ? (effectiveValue as unknown[]).map((v, i) => [i, v])
    : Object.entries(effectiveValue as Record<string, unknown>);

  const openBracket = isArr ? '[' : '{';
  const closeBracket = isArr ? ']' : '}';
  const empty = entries.length === 0;

  const copy = () => {
    const text = isNestedView
      ? (rawValue as string)
      : JSON.stringify(effectiveValue);
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 900);
  };

  return (
    <div className="jn">
      <div className="jn-row">
        {!empty ? (
          <button
            className="jn-toggle"
            onClick={() => api.toggleExpanded(path, depth)}
            aria-label={expanded ? '折叠' : '展开'}
          >
            {expanded ? '▾' : '▸'}
          </button>
        ) : (
          <span className="jn-toggle jn-toggle-empty" />
        )}
        <KeyLabel keyLabel={keyLabel} />
        {isNestedView && (
          <span className="jn-badge" title="此值为 JSON 字符串，已解析为嵌套结构">
            nested
          </span>
        )}
        <span className="jn-bracket">{openBracket}</span>
        {empty ? (
          <span className="jn-bracket">{closeBracket}</span>
        ) : !expanded ? (
          <>
            <span className="jn-summary">
              {entries.length} {isArr ? 'items' : 'keys'}
            </span>
            <span className="jn-bracket">{closeBracket}</span>
          </>
        ) : null}

        <span className="jn-actions">
          {isNestedView && (
            <button
              className="jn-act"
              onClick={() => api.toggleNested(path)}
              title="折叠嵌套 JSON"
            >
              折叠嵌套
            </button>
          )}
          <button className="jn-act" onClick={copy} title="复制此节点">
            {copied ? '✓ 已复制' : '复制'}
          </button>
        </span>
      </div>

      {!empty && expanded && (
        <>
          <div className="jn-children">
            {entries.map(([k, v]) => (
              <JsonNode
                key={String(k)}
                value={v}
                keyLabel={isArr ? (k as number) : (k as string)}
                path={path + '/' + String(k)}
                depth={depth + 1}
                api={api}
                isArrayItem={isArr}
              />
            ))}
          </div>
          <div className="jn-row jn-row-close">
            <span className="jn-toggle jn-toggle-empty" />
            <span className="jn-bracket">{closeBracket}</span>
          </div>
        </>
      )}
    </div>
  );
}

function PrimitiveNode({ value, keyLabel, path, api }: JsonNodeProps) {
  const [copied, setCopied] = useState(false);
  const isString = typeof value === 'string';
  const isUnescaped = isString && api.isUnescaped(path);
  const strValue = isString ? (value as string) : '';
  const displayStr = isUnescaped ? unescapeString(strValue) : strValue;

  let content: React.ReactNode;
  let valueClass = '';
  if (value === null) {
    content = 'null';
    valueClass = 'jn-v-null';
  } else if (typeof value === 'boolean') {
    content = String(value);
    valueClass = 'jn-v-bool';
  } else if (typeof value === 'number') {
    content = String(value);
    valueClass = 'jn-v-num';
  } else if (isString) {
    content = (
      <>
        <span className="jn-quote">"</span>
        <span className="jn-str-text">{displayStr}</span>
        <span className="jn-quote">"</span>
      </>
    );
    valueClass = 'jn-v-str';
  } else {
    content = String(value);
  }

  const looksLikeJson = isString && isLikelyJsonString(strValue);
  const isLong = isString && strValue.length > LONG_VALUE_THRESHOLD;
  const hasEscape = isString && /\\["'\\/bfnrt]|\\u[0-9a-fA-F]{4}/.test(strValue);

  const copy = () => {
    const text = isString ? strValue : String(value);
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 900);
  };

  return (
    <div className="jn">
      <div className="jn-row jn-leaf">
        <span className="jn-toggle jn-toggle-empty" />
        <KeyLabel keyLabel={keyLabel} />
        <span className={`jn-value ${valueClass} ${isLong ? 'jn-v-long' : ''}`}>
          {content}
        </span>
        <span className="jn-actions">
          <button className="jn-act" onClick={copy} title="复制值">
            {copied ? '✓' : '复制'}
          </button>
          {looksLikeJson && (
            <button
              className="jn-act"
              onClick={() => api.toggleNested(path)}
              title="将该字符串作为 JSON 展开"
            >
              嵌套解析
            </button>
          )}
          {hasEscape && (
            <button
              className="jn-act"
              onClick={() => api.toggleUnescaped(path)}
              title="去除该值中的转义字符"
            >
              {isUnescaped ? '还原' : '去转义'}
            </button>
          )}
          {isString && (
            <button
              className="jn-act"
              onClick={() =>
                api.onOpenValue(
                  strValue,
                  keyLabel !== null ? String(keyLabel) : undefined
                )
              }
              title="在弹窗中查看该值"
            >
              查看
            </button>
          )}
        </span>
      </div>
    </div>
  );
}

function KeyLabel({ keyLabel }: { keyLabel: string | number | null }) {
  if (keyLabel === null) return null;
  if (typeof keyLabel === 'number') {
    return (
      <>
        <span className="jn-index">{keyLabel}</span>
        <span className="jn-punct">: </span>
      </>
    );
  }
  return (
    <>
      <span className="jn-key">"{keyLabel}"</span>
      <span className="jn-punct">: </span>
    </>
  );
}
