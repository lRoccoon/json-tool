import { useEffect, useId, useRef, useState } from 'react';
import {
  DEFAULT_SHARE_ENDPOINT,
  isValidShareEndpoint,
  loadShareEndpoint,
  saveShareEndpoint,
} from '../utils/shareConfig';
import { buildShareUrl, uploadToTransfer } from '../utils/transferShare';

interface SharePanelProps {
  content: string;
}

interface ShareResult {
  transferUrl: string;
  shareUrl: string;
}

export function SharePanel({ content }: SharePanelProps) {
  const [open, setOpen] = useState(false);
  const [endpoint, setEndpoint] = useState(() => loadShareEndpoint());
  const [endpointDraft, setEndpointDraft] = useState(endpoint);
  const [savedHint, setSavedHint] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<ShareResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<'share' | 'transfer' | null>(null);

  const panelRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const prevOpenRef = useRef(open);
  const titleId = useId();

  useEffect(() => {
    if (prevOpenRef.current === open) return;
    prevOpenRef.current = open;
    if (open) {
      closeButtonRef.current?.focus();
    } else {
      triggerRef.current?.focus();
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;

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

  useEffect(() => {
    if (!savedHint) return;
    const id = window.setTimeout(() => setSavedHint(false), 1500);
    return () => window.clearTimeout(id);
  }, [savedHint]);

  useEffect(() => {
    if (!copied) return;
    const id = window.setTimeout(() => setCopied(null), 1500);
    return () => window.clearTimeout(id);
  }, [copied]);

  const endpointDirty = endpointDraft.trim() !== endpoint;
  const endpointValid = isValidShareEndpoint(endpointDraft);
  const canShare = !uploading && content.trim().length > 0;

  const persistEndpoint = () => {
    if (!endpointValid || !endpointDirty) return;
    const next = saveShareEndpoint(endpointDraft);
    setEndpoint(next);
    setEndpointDraft(next);
    setSavedHint(true);
  };

  const resetEndpoint = () => {
    const next = saveShareEndpoint(DEFAULT_SHARE_ENDPOINT);
    setEndpoint(next);
    setEndpointDraft(next);
    setSavedHint(true);
  };

  const generate = async () => {
    if (!canShare) return;
    setUploading(true);
    setError(null);
    setResult(null);
    try {
      const transferUrl = await uploadToTransfer(endpoint, content);
      setResult({ transferUrl, shareUrl: buildShareUrl(transferUrl) });
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setUploading(false);
    }
  };

  const copy = async (value: string, kind: 'share' | 'transfer') => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(kind);
    } catch {
      setError('复制失败，请手动选择链接复制');
    }
  };

  return (
    <section className="share-panel" aria-label="分享当前 JSON" ref={panelRef}>
      <button
        type="button"
        ref={triggerRef}
        className={`btn share-trigger${open ? ' is-open' : ''}`}
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-controls={open ? 'share-popover' : undefined}
        aria-label="打开分享面板"
      >
        <span className="share-trigger-label">分享</span>
      </button>

      {open && (
        <div
          id="share-popover"
          className="share-popover"
          role="dialog"
          aria-modal="false"
          aria-labelledby={titleId}
        >
          <div className="share-head">
            <div className="share-title-wrap">
              <span className="share-title" id={titleId}>
                Share
              </span>
              <span className="share-meta">基于 transfer.sh 的临时存储</span>
            </div>
            <button
              type="button"
              ref={closeButtonRef}
              className="share-close"
              onClick={() => setOpen(false)}
              aria-label="关闭分享面板"
            >
              关闭
            </button>
          </div>

          <div className="share-section">
            <label className="share-field">
              <span className="share-field-label">存储地址</span>
              <input
                type="url"
                className="share-input"
                value={endpointDraft}
                placeholder={DEFAULT_SHARE_ENDPOINT}
                onChange={(e) => setEndpointDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    persistEndpoint();
                  }
                }}
                spellCheck={false}
                autoComplete="off"
              />
            </label>
            <div className="share-field-row">
              <button
                type="button"
                className="share-btn"
                onClick={persistEndpoint}
                disabled={!endpointDirty || !endpointValid}
              >
                保存
              </button>
              <button
                type="button"
                className="share-btn share-btn-ghost"
                onClick={resetEndpoint}
                disabled={
                  endpoint === DEFAULT_SHARE_ENDPOINT &&
                  endpointDraft.trim() === DEFAULT_SHARE_ENDPOINT
                }
              >
                恢复默认
              </button>
              <span className="share-field-hint" aria-live="polite">
                {savedHint
                  ? '已保存'
                  : !endpointValid && endpointDraft.trim()
                  ? '请输入完整 http(s) 地址'
                  : `当前：${endpoint}`}
              </span>
            </div>
          </div>

          <div className="share-section">
            <div className="share-action-row">
              <button
                type="button"
                className="share-btn share-btn-primary"
                onClick={generate}
                disabled={!canShare}
              >
                {uploading ? '上传中…' : '生成分享链接'}
              </button>
              <span className="share-action-hint">
                {content.trim().length === 0
                  ? '请先输入要分享的内容'
                  : `${content.length.toLocaleString()} 字符将被上传`}
              </span>
            </div>
            {error && <div className="share-error">错误：{error}</div>}
            {result && (
              <div className="share-result">
                <div className="share-result-row">
                  <span className="share-result-label">分享链接</span>
                  <input
                    type="text"
                    className="share-input share-input-readonly"
                    value={result.shareUrl}
                    readOnly
                    onFocus={(e) => e.currentTarget.select()}
                  />
                  <button
                    type="button"
                    className="share-btn"
                    onClick={() => copy(result.shareUrl, 'share')}
                  >
                    {copied === 'share' ? '已复制' : '复制'}
                  </button>
                </div>
                <div className="share-result-row">
                  <span className="share-result-label">原始 URL</span>
                  <a
                    className="share-result-link"
                    href={result.transferUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {result.transferUrl}
                  </a>
                  <button
                    type="button"
                    className="share-btn share-btn-ghost"
                    onClick={() => copy(result.transferUrl, 'transfer')}
                  >
                    {copied === 'transfer' ? '已复制' : '复制'}
                  </button>
                </div>
                <p className="share-result-note">
                  打开分享链接将自动加载内容到 Source 面板。原始 URL 受 transfer.sh 默认保留期限限制。
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
