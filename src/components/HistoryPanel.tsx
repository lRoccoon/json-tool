import { useEffect, useId, useRef, useState } from 'react';
import {
  formatHistoryTimestamp,
  getHistoryPreview,
  type HistoryEntry,
} from '../utils/historyStore';

interface HistoryPanelProps {
  entries: HistoryEntry[];
  activeContent: string;
  onRestore: (entry: HistoryEntry) => void;
  onRemove: (id: string) => void;
  onClear: () => void;
}

export function HistoryPanel({
  entries,
  activeContent,
  onRestore,
  onRemove,
  onClear,
}: HistoryPanelProps) {
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const titleId = useId();

  useEffect(() => {
    if (open) {
      closeButtonRef.current?.focus();
    } else {
      triggerRef.current?.focus();
    }
  }, [open]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const onPointerDown = (event: PointerEvent) => {
      if (!panelRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
      }
    };

    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);

    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  const onRestoreEntry = (entry: HistoryEntry) => {
    onRestore(entry);
    setOpen(false);
  };

  const onClearHistory = () => {
    onClear();
    setOpen(false);
  };

  return (
    <section className="history-panel" aria-label="最近输入历史" ref={panelRef}>
      <button
        type="button"
        ref={triggerRef}
        className={`history-trigger${open ? ' is-open' : ''}`}
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-controls={open ? 'history-popover' : undefined}
        aria-label={entries.length > 0 ? `打开历史记录，当前 ${entries.length} 条` : '打开历史记录'}
      >
        <span className="history-trigger-label">历史</span>
        <span className="history-trigger-count">
          {entries.length > 0 ? entries.length : '空'}
        </span>
      </button>

      {open && (
        <div
          id="history-popover"
          className="history-popover"
          role="dialog"
          aria-modal="false"
          aria-labelledby={titleId}
        >
          <div className="history-head">
            <div className="history-title-wrap">
              <span className="history-title" id={titleId}>Recent</span>
              <span className="history-meta">
                {entries.length > 0 ? `${entries.length} 条` : '本地历史'}
              </span>
            </div>
            <div className="history-head-actions">
              <button
                type="button"
                className="history-clear"
                onClick={onClearHistory}
                disabled={entries.length === 0}
              >
                清空历史
              </button>
              <button
                type="button"
                ref={closeButtonRef}
                className="history-close"
                onClick={() => setOpen(false)}
                aria-label="关闭历史记录"
              >
                关闭
              </button>
            </div>
          </div>

          {entries.length === 0 ? (
            <div className="history-empty">
              最近处理过的 JSON 会自动保存在当前浏览器。
            </div>
          ) : (
            <div className="history-list" role="list">
              {entries.map((entry) => {
                const isActive = entry.content === activeContent;

                return (
                  <article
                    key={entry.id}
                    className={`history-item${isActive ? ' is-active' : ''}`}
                    role="listitem"
                  >
                    <button
                      type="button"
                      className="history-main"
                      onClick={() => onRestoreEntry(entry)}
                      aria-label={`恢复历史记录：${getHistoryPreview(entry.content)}`}
                    >
                      <span className="history-summary">
                        {getHistoryPreview(entry.content)}
                      </span>
                      <span className="history-item-meta">
                        {entry.size.toLocaleString()} 字符 ·{' '}
                        {formatHistoryTimestamp(entry.updatedAt)}
                      </span>
                    </button>
                    <div className="history-actions">
                      <button
                        type="button"
                        className="history-btn"
                        onClick={() => onRestoreEntry(entry)}
                      >
                        恢复
                      </button>
                      <button
                        type="button"
                        className="history-btn history-btn-danger"
                        onClick={() => onRemove(entry.id)}
                        aria-label={`删除历史记录：${getHistoryPreview(entry.content)}`}
                      >
                        删除
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
