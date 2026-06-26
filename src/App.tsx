import { useEffect, useState } from 'react';
import { FormatTool } from './components/FormatTool';
import { JsonDiff } from './components/JsonDiff';

type View = 'format' | 'diff';

function viewFromHash(): View {
  return window.location.hash.replace(/^#/, '').split('&')[0] === 'diff'
    ? 'diff'
    : 'format';
}

export default function App() {
  const [view, setView] = useState<View>(() => viewFromHash());

  useEffect(() => {
    const onHashChange = () => setView(viewFromHash());
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  const goTo = (next: View) => {
    if (next === 'diff') {
      window.location.hash = 'diff';
    } else if (viewFromHash() === 'diff') {
      history.replaceState(
        null,
        '',
        window.location.pathname + window.location.search
      );
      setView('format');
    }
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
          <nav className="app-nav" aria-label="视图切换">
            <button
              type="button"
              className={`app-nav-tab${view === 'format' ? ' is-active' : ''}`}
              onClick={() => goTo('format')}
            >
              格式化
            </button>
            <button
              type="button"
              className={`app-nav-tab${view === 'diff' ? ' is-active' : ''}`}
              onClick={() => goTo('diff')}
            >
              比较
            </button>
          </nav>
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

      {view === 'format' ? <FormatTool /> : <JsonDiff />}
    </div>
  );
}
