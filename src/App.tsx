import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { HistoryPanel } from './components/HistoryPanel';
import { SharePanel } from './components/SharePanel';
import { Toolbar } from './components/Toolbar';
import { JsonTree } from './components/JsonTree';
import { ValuePopup } from './components/ValuePopup';
import {
  collectMatches,
  deleteJsonAtPath,
  tryParseJson,
  type SearchScope,
} from './utils/jsonUtils';
import {
  HISTORY_STORAGE_KEY,
  clearHistory,
  loadHistory,
  removeHistoryEntry,
  saveHistoryEntry,
  type HistoryEntry,
} from './utils/historyStore';
import { fetchSharedContent, parseShareHash } from './utils/transferShare';

const SPLIT_MIN = 20;
const SPLIT_MAX = 80;
const SPLIT_DEFAULT = 44;
const HISTORY_SAVE_DELAY = 600;

export default function App() {
  const [input, setInput] = useState('');
  const [historyEntries, setHistoryEntries] = useState<HistoryEntry[]>(() =>
    loadHistory()
  );
  const [expandLevel, setExpandLevel] = useState(2);
  const [popup, setPopup] = useState<{ text: string; title?: string } | null>(
    null
  );
  const [splitPct, setSplitPct] = useState(SPLIT_DEFAULT);
  const [dragging, setDragging] = useState(false);
  const mainRef = useRef<HTMLElement>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchScope, setSearchScope] = useState<SearchScope>('all');
  const [currentMatchIndex, setCurrentMatchIndex] = useState(0);
  const [sortKeys, setSortKeys] = useState<'none' | 'asc' | 'desc'>('none');
  const [shareLoading, setShareLoading] = useState(false);
  const [shareLoadError, setShareLoadError] = useState<string | null>(null);

  const parsed = useMemo(() => tryParseJson(input), [input]);
  const hasInput = input.trim().length > 0;

  const { matches, ancestors } = useMemo(
    () =>
      parsed.ok
        ? collectMatches(parsed.value, searchScope, searchQuery, sortKeys)
        : { matches: [] as string[], ancestors: new Set<string>() },
    [parsed, searchScope, searchQuery, sortKeys]
  );

  useEffect(() => {
    setCurrentMatchIndex(0);
  }, [matches]);

  useEffect(() => {
    if (!input.trim()) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setHistoryEntries(saveHistoryEntry(input));
    }, HISTORY_SAVE_DELAY);

    return () => window.clearTimeout(timeoutId);
  }, [input]);

  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key === HISTORY_STORAGE_KEY) {
        setHistoryEntries(loadHistory());
      }
    };

    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  useEffect(() => {
    const target = parseShareHash(window.location.hash);
    if (!target) return;

    let cancelled = false;
    setShareLoading(true);
    setShareLoadError(null);
    fetchSharedContent(target)
      .then((text) => {
        if (cancelled) return;
        setInput(text);
        history.replaceState(null, '', window.location.pathname + window.location.search);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setShareLoadError(err instanceof Error ? err.message : String(err));
      })
      .finally(() => {
        if (!cancelled) setShareLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const matchCount = matches.length;
  const hasQuery = searchQuery.trim().length > 0;
  const goPrev = () =>
    matchCount &&
    setCurrentMatchIndex((i) => (i - 1 + matchCount) % matchCount);
  const goNext = () =>
    matchCount && setCurrentMatchIndex((i) => (i + 1) % matchCount);

  const onRulePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    setDragging(true);
  };
  const onRulePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!e.currentTarget.hasPointerCapture(e.pointerId)) return;
    const rect = mainRef.current?.getBoundingClientRect();
    if (!rect) return;
    const pct = ((e.clientX - rect.left) / rect.width) * 100;
    setSplitPct(Math.max(SPLIT_MIN, Math.min(SPLIT_MAX, pct)));
  };
  const onRulePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
    setDragging(false);
  };
  const onRuleDoubleClick = () => setSplitPct(SPLIT_DEFAULT);

  const mainStyle = {
    '--split-left': `${splitPct}fr`,
    '--split-right': `${100 - splitPct}fr`,
  } as CSSProperties;

  const handleDeletePath = (path: string) => {
    if (!parsed.ok || !path) {
      return;
    }

    const nextValue = deleteJsonAtPath(parsed.value, path);
    if (nextValue === parsed.value) {
      return;
    }

    setInput(JSON.stringify(nextValue, null, 2));
  };

  return (
    <div className="app">
      <header className="app-header">
        <div className="app-header-col app-header-title">
          <h1 className="app-title">
            JSON
            <em className="app-title-em">tool</em>
            <span className="app-title-mark" aria-hidden>·</span>
          </h1>
          <p className="app-kicker">
            <span>A developer notebook for unwieldy JSON</span>
          </p>
        </div>
        <div className="app-header-col app-header-meta">
          <span className="tag">格式化</span>
          <span className="tag-sep">/</span>
          <span className="tag">压缩</span>
          <span className="tag-sep">/</span>
          <span className="tag">转义</span>
          <span className="tag-sep">/</span>
          <span className="tag">嵌套解析</span>
          <span className="tag-sep">·</span>
          <a
            className="tag tag-link"
            href="https://github.com/lRoccoon/json-tool"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="GitHub repository"
          >
            <svg
              className="tag-link-icon"
              viewBox="0 0 16 16"
              width="14"
              height="14"
              aria-hidden
            >
              <path
                fill="currentColor"
                d="M8 0C3.58 0 0 3.58 0 8a8 8 0 0 0 5.47 7.59c.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8Z"
              />
            </svg>
            <span>GitHub</span>
          </a>
        </div>
      </header>

      <main className="app-main" ref={mainRef} style={mainStyle}>
        <section className="panel panel-input">
          <div className="panel-label">
            <span className="panel-label-num">01</span>
            <span className="panel-label-text">Source</span>
            <span className="panel-label-rule" aria-hidden />
            <div className="panel-label-actions">
              <SharePanel content={input} />
              <HistoryPanel
                entries={historyEntries}
                activeContent={input}
                onRestore={(entry) => setInput(entry.content)}
                onRemove={(id) => setHistoryEntries(removeHistoryEntry(id))}
                onClear={() => setHistoryEntries(clearHistory())}
              />
            </div>
          </div>
          <Toolbar input={input} setInput={setInput} />
          <div className="input-area-wrap">
            <textarea
              className="input-area"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={'在此粘贴 JSON 或转义后的 JSON 字符串…'}
              spellCheck={false}
              readOnly={shareLoading}
            />
            {shareLoading && (
              <div className="panel-loading" role="status" aria-live="polite">
                <span className="panel-loading-spinner" aria-hidden />
                <span className="panel-loading-text">正在加载分享内容…</span>
              </div>
            )}
          </div>
          <div className="panel-footer">
            <span className="footer-meta">
              {shareLoading
                ? '正在加载分享内容'
                : input.length > 0
                ? `${input.length.toLocaleString()} 字符`
                : '等待输入'}
            </span>
            {!shareLoading && shareLoadError && (
              <span className="status status-err">
                ✦ 分享加载失败 · {shareLoadError}
              </span>
            )}
            {!shareLoading && !shareLoadError && hasInput && !parsed.ok && (
              <span className="status status-err">
                ✦ 无法解析 · {parsed.error}
              </span>
            )}
            {!shareLoading && !shareLoadError && hasInput && parsed.ok && (
              <span className="status status-ok">✓ 有效 JSON</span>
            )}
          </div>
        </section>

        <div
          className={`panel-rule${dragging ? ' is-dragging' : ''}`}
          role="separator"
          aria-orientation="vertical"
          aria-label="调整面板宽度"
          aria-valuenow={Math.round(splitPct)}
          aria-valuemin={SPLIT_MIN}
          aria-valuemax={SPLIT_MAX}
          tabIndex={0}
          onPointerDown={onRulePointerDown}
          onPointerMove={onRulePointerMove}
          onPointerUp={onRulePointerUp}
          onPointerCancel={onRulePointerUp}
          onDoubleClick={onRuleDoubleClick}
          onKeyDown={(e) => {
            if (e.key === 'ArrowLeft')
              setSplitPct((p) => Math.max(SPLIT_MIN, p - 2));
            else if (e.key === 'ArrowRight')
              setSplitPct((p) => Math.min(SPLIT_MAX, p + 2));
            else if (e.key === 'Home' || e.key === 'End')
              setSplitPct(SPLIT_DEFAULT);
          }}
        />

        <section className="panel panel-tree">
          <div className="panel-label">
            <span className="panel-label-num">02</span>
            <span className="panel-label-text">Tree</span>
            <span className="panel-label-rule" aria-hidden />
          </div>
          <div className="tree-controls">
          <div className="tree-toolbar">
            <label className="tree-toolbar-item">
              <span className="tree-toolbar-label">展开</span>
              <select
                value={expandLevel}
                onChange={(e) => setExpandLevel(Number(e.target.value))}
              >
                <option value={1}>1 级</option>
                <option value={2}>2 级</option>
                <option value={3}>3 级</option>
                <option value={4}>4 级</option>
                <option value={5}>5 级</option>
                <option value={99}>全部</option>
              </select>
            </label>
            <span className="tree-sep" aria-hidden />
            <button
              className="tbtn"
              disabled={!parsed.ok}
              onClick={() => {
                if (parsed.ok)
                  navigator.clipboard.writeText(JSON.stringify(parsed.value));
              }}
            >
              复制压缩
            </button>
            <button
              className="tbtn"
              disabled={!parsed.ok}
              onClick={() => {
                if (parsed.ok)
                  navigator.clipboard.writeText(
                    JSON.stringify(parsed.value, null, 2)
                  );
              }}
            >
              复制格式化
            </button>
            <button
              className={`tbtn${sortKeys !== 'none' ? ' is-active' : ''}`}
              disabled={!parsed.ok}
              onClick={() =>
                setSortKeys((s) =>
                  s === 'none' ? 'asc' : s === 'asc' ? 'desc' : 'none'
                )
              }
              title="按 Key 排序（仅对象，不影响数组顺序）"
            >
              {sortKeys === 'none'
                ? 'Key 排序'
                : sortKeys === 'asc'
                ? 'Key A→Z'
                : 'Key Z→A'}
            </button>
          </div>
          <div className="tree-search">
            <input
              type="search"
              className="tree-search-input"
              placeholder="搜索 key / value…"
              value={searchQuery}
              disabled={!parsed.ok}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  if (e.shiftKey) goPrev();
                  else goNext();
                } else if (e.key === 'Escape') {
                  setSearchQuery('');
                }
              }}
            />
            <div
              className="tree-search-scope"
              role="group"
              aria-label="搜索范围"
            >
              {(['all', 'key', 'value'] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  className={`scope-btn${searchScope === s ? ' is-active' : ''}`}
                  onClick={() => setSearchScope(s)}
                  disabled={!parsed.ok}
                >
                  {s === 'all' ? '全部' : s === 'key' ? 'Key' : 'Value'}
                </button>
              ))}
            </div>
            <button
              type="button"
              className="tbtn tbtn-nav"
              disabled={matchCount === 0}
              onClick={goPrev}
              title="上一个匹配 (Shift+Enter)"
              aria-label="上一个匹配"
            >
              ↑
            </button>
            <button
              type="button"
              className="tbtn tbtn-nav"
              disabled={matchCount === 0}
              onClick={goNext}
              title="下一个匹配 (Enter)"
              aria-label="下一个匹配"
            >
              ↓
            </button>
            <span
              className={`tree-search-count${
                hasQuery && matchCount === 0 ? ' is-empty' : ''
              }`}
              aria-live="polite"
            >
              {!hasQuery
                ? ''
                : matchCount === 0
                ? '无匹配'
                : `${currentMatchIndex + 1} / ${matchCount}`}
            </span>
          </div>
          </div>
          <div className="tree-body">
            {parsed.ok ? (
              <JsonTree
                value={parsed.value}
                expandLevel={expandLevel}
                onOpenValue={(text, title) => setPopup({ text, title })}
                onDeletePath={handleDeletePath}
                searchQuery={searchQuery.trim()}
                searchScope={searchScope}
                searchMatches={matches}
                searchAncestors={ancestors}
                searchCurrentIndex={currentMatchIndex}
                sortKeys={sortKeys}
              />
            ) : hasInput ? (
              <div className="tree-empty error">
                <em>当前输入无法解析为 JSON。</em>
                <br />
                可在左侧工具栏中尝试「去转义」。
              </div>
            ) : (
              <div className="tree-empty">
                <em>等待输入。</em>
                <br />
                在左侧粘贴 JSON，结构树将在此呈现。
              </div>
            )}
          </div>
        </section>
      </main>

      {popup && (
        <ValuePopup
          text={popup.text}
          title={popup.title}
          onClose={() => setPopup(null)}
        />
      )}
    </div>
  );
}
