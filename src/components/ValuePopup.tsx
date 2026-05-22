import { useEffect, useState } from 'react';
import { unescapeString } from '../utils/jsonUtils';
import { MarkdownView } from '../utils/markdown';

interface ValuePopupProps {
  text: string;
  title?: string;
  onClose: () => void;
}

export function ValuePopup({ text, title, onClose }: ValuePopupProps) {
  const [wrap, setWrap] = useState(true);
  const [unesc, setUnesc] = useState(false);
  const [md, setMd] = useState(true);
  const [copied, setCopied] = useState(false);

  const displayed = unesc ? unescapeString(text) : text;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const copy = () => {
    navigator.clipboard.writeText(displayed);
    setCopied(true);
    setTimeout(() => setCopied(false), 1000);
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className="modal-head">
          <strong className="modal-title">
            值详情{title ? ` · ${title}` : ''}
          </strong>
          <span className="modal-meta">
            {displayed.length.toLocaleString()} 字符
          </span>
          <label className="modal-check">
            <input
              type="checkbox"
              checked={md}
              onChange={(e) => setMd(e.target.checked)}
            />
            Markdown
          </label>
          <label className={`modal-check${md ? ' is-disabled' : ''}`}>
            <input
              type="checkbox"
              checked={wrap}
              disabled={md}
              onChange={(e) => setWrap(e.target.checked)}
            />
            自动换行
          </label>
          <label className="modal-check">
            <input
              type="checkbox"
              checked={unesc}
              onChange={(e) => setUnesc(e.target.checked)}
            />
            去除转义
          </label>
          <button className="btn" onClick={copy}>
            {copied ? '✓ 已复制' : '复制'}
          </button>
          <button className="btn ghost" onClick={onClose}>
            关闭
          </button>
        </div>
        {md ? (
          <div className="modal-body modal-body-md">
            <MarkdownView text={displayed} />
          </div>
        ) : (
          <pre className={`modal-body ${wrap ? 'wrap' : 'nowrap'}`}>
            {displayed}
          </pre>
        )}
      </div>
    </div>
  );
}
