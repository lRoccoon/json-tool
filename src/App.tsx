import { useMemo, useState } from 'react';
import { Toolbar } from './components/Toolbar';
import { JsonTree } from './components/JsonTree';
import { ValuePopup } from './components/ValuePopup';
import { tryParseJson } from './utils/jsonUtils';

export default function App() {
  const [input, setInput] = useState('');
  const [expandLevel, setExpandLevel] = useState(2);
  const [popup, setPopup] = useState<{ text: string; title?: string } | null>(
    null
  );

  const parsed = useMemo(() => tryParseJson(input), [input]);
  const hasInput = input.trim().length > 0;

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
        </div>
      </header>

      <main className="app-main">
        <section className="panel panel-input">
          <div className="panel-label">
            <span className="panel-label-num">01</span>
            <span className="panel-label-text">Source</span>
            <span className="panel-label-rule" aria-hidden />
          </div>
          <Toolbar input={input} setInput={setInput} />
          <textarea
            className="input-area"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={'在此粘贴 JSON 或转义后的 JSON 字符串…'}
            spellCheck={false}
          />
          <div className="panel-footer">
            <span className="footer-meta">
              {input.length > 0
                ? `${input.length.toLocaleString()} 字符`
                : '等待输入'}
            </span>
            {hasInput && !parsed.ok && (
              <span className="status status-err">
                ✦ 无法解析 · {parsed.error}
              </span>
            )}
            {hasInput && parsed.ok && (
              <span className="status status-ok">✓ 有效 JSON</span>
            )}
          </div>
        </section>

        <aside className="panel-rule" aria-hidden />

        <section className="panel panel-tree">
          <div className="panel-label">
            <span className="panel-label-num">02</span>
            <span className="panel-label-text">Tree</span>
            <span className="panel-label-rule" aria-hidden />
          </div>
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
          </div>
          <div className="tree-body">
            {parsed.ok ? (
              <JsonTree
                value={parsed.value}
                expandLevel={expandLevel}
                onOpenValue={(text, title) => setPopup({ text, title })}
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
