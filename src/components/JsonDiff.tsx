import { useCallback, useMemo, useState } from 'react';
import { DiffTree } from './DiffTree';
import { diffJson, summarizeDiff, type DiffNode } from '../utils/jsonDiff';
import { tryParseJson, type JsonValue } from '../utils/jsonUtils';

const EXPAND_OPTIONS = [1, 2, 3, 4, 5, 99] as const;

export function JsonDiff() {
  const [inputA, setInputA] = useState('');
  const [inputB, setInputB] = useState('');
  const [parseAll, setParseAll] = useState(false);
  const [parsedPaths, setParsedPaths] = useState<Set<string>>(new Set());
  const [onlyDiff, setOnlyDiff] = useState(false);
  const [expandLevel, setExpandLevel] = useState(99);

  const parsedA = useMemo(() => tryParseJson(inputA), [inputA]);
  const parsedB = useMemo(() => tryParseJson(inputB), [inputB]);
  const bothOk = parsedA.ok && parsedB.ok;

  const shouldParseNested = useMemo(
    () => (path: string) => parseAll || parsedPaths.has(path),
    [parseAll, parsedPaths]
  );

  const diff = useMemo<DiffNode | null>(() => {
    if (!parsedA.ok || !parsedB.ok) return null;
    return diffJson(parsedA.value as JsonValue, parsedB.value as JsonValue, {
      shouldParseNested,
    });
  }, [parsedA, parsedB, shouldParseNested]);

  const summary = useMemo(() => (diff ? summarizeDiff(diff) : null), [diff]);
  const identical =
    summary !== null &&
    summary.added + summary.removed + summary.changed === 0;

  const onToggleNested = useCallback((path: string) => {
    setParsedPaths((prev) => {
      const next = new Set(prev);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      return next;
    });
  }, []);

  const hasA = inputA.trim().length > 0;
  const hasB = inputB.trim().length > 0;

  const renderStatus = (
    has: boolean,
    parsed: ReturnType<typeof tryParseJson>,
    len: number
  ) => (
    <div className="panel-footer" role="status" aria-live="polite">
      <span className="footer-meta">
        {has ? `${len.toLocaleString()} 字符` : '等待输入'}
      </span>
      {has && !parsed.ok && (
        <span className="status status-err">✦ 无法解析 · {parsed.error}</span>
      )}
      {has && parsed.ok && <span className="status status-ok">✓ 有效 JSON</span>}
    </div>
  );

  return (
    <main className="app-main diff-main">
      <section className="diff-inputs">
        <div className="diff-input-col">
          <div className="panel-label">
            <span className="panel-label-num">A</span>
            <span className="panel-label-text">Old</span>
            <span className="panel-label-rule" aria-hidden />
          </div>
          <textarea
            className="input-area"
            value={inputA}
            onChange={(e) => setInputA(e.target.value)}
            placeholder="粘贴第一段 JSON（Old）…"
            spellCheck={false}
            aria-label="Old JSON（A）"
          />
          {renderStatus(hasA, parsedA, inputA.length)}
        </div>
        <div className="diff-input-col">
          <div className="panel-label">
            <span className="panel-label-num">B</span>
            <span className="panel-label-text">New</span>
            <span className="panel-label-rule" aria-hidden />
          </div>
          <textarea
            className="input-area"
            value={inputB}
            onChange={(e) => setInputB(e.target.value)}
            placeholder="粘贴第二段 JSON（New）…"
            spellCheck={false}
            aria-label="New JSON（B）"
          />
          {renderStatus(hasB, parsedB, inputB.length)}
        </div>
      </section>

      <section className="diff-result">
        <div className="diff-controls">
          <label className="tree-toolbar-item">
            <span className="tree-toolbar-label">展开</span>
            <select
              value={expandLevel}
              onChange={(e) => setExpandLevel(Number(e.target.value))}
            >
              {EXPAND_OPTIONS.map((lv) => (
                <option key={lv} value={lv}>
                  {lv === 99 ? '全部' : `${lv} 级`}
                </option>
              ))}
            </select>
          </label>
          <button
            className={`tbtn${onlyDiff ? ' is-active' : ''}`}
            disabled={!bothOk}
            onClick={() => setOnlyDiff((v) => !v)}
            title="折叠未变更的子树"
          >
            仅显示差异
          </button>
          <button
            className={`tbtn${parseAll ? ' is-active' : ''}`}
            disabled={!bothOk}
            onClick={() => setParseAll((v) => !v)}
            title="把所有看起来是 JSON 的字符串解析后再比较"
          >
            全部解析嵌套
          </button>
          {summary && (
            <span className="diff-summary-bar">
              <span className="diff-sum add">+{summary.added}</span>
              <span className="diff-sum del">-{summary.removed}</span>
              <span className="diff-sum chg">~{summary.changed}</span>
            </span>
          )}
        </div>

        <div className="diff-body">
          {bothOk && diff ? (
            identical ? (
              <div className="tree-empty">
                <em>两段 JSON 内容一致。</em>
              </div>
            ) : (
              <DiffTree
                root={diff}
                expandLevel={expandLevel}
                onlyDiff={onlyDiff}
                parseAll={parseAll}
                onToggleNested={onToggleNested}
              />
            )
          ) : (
            <div className="tree-empty">
              <em>
                {!hasA && !hasB
                  ? '在上方粘贴两段 JSON 进行比较。'
                  : !hasA || !hasB
                  ? '请在另一侧粘贴 JSON 以开始比较。'
                  : '存在无法解析的 JSON，无法比较。'}
              </em>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
