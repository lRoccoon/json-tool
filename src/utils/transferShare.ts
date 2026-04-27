import { normalizeShareEndpoint } from './shareConfig';

const SHARE_FILENAME = 'share.json';
const SHARE_HASH_KEY = 'share';
const MAX_FETCH_BYTES = 8 * 1024 * 1024;

export interface UploadOutcome {
  transferUrl: string;
  shareUrl: string;
}

export async function uploadToTransfer(
  endpoint: string,
  content: string,
  filename: string = SHARE_FILENAME
): Promise<string> {
  const base = normalizeShareEndpoint(endpoint);
  if (!base) {
    throw new Error('未配置有效的分享存储地址');
  }

  const safeName = sanitizeFilename(filename);
  const target = `${base}/${encodeURIComponent(safeName)}`;

  let response: Response;
  try {
    response = await fetch(target, {
      method: 'PUT',
      body: content,
    });
  } catch (error) {
    throw new Error(
      `网络请求失败：${error instanceof Error ? error.message : String(error)}`
    );
  }

  if (!response.ok) {
    throw new Error(`上传失败：HTTP ${response.status}`);
  }

  const body = (await response.text()).trim();
  const url = body.split(/\s+/)[0] ?? '';
  if (!/^https?:\/\//i.test(url)) {
    throw new Error('上传成功但响应不包含合法的 URL');
  }
  return url;
}

export function buildShareUrl(transferUrl: string): string {
  if (typeof window === 'undefined') {
    return transferUrl;
  }
  const { origin, pathname, search } = window.location;
  return `${origin}${pathname}${search}#${SHARE_HASH_KEY}=${encodeURIComponent(transferUrl)}`;
}

export function parseShareHash(hash: string | null | undefined): string | null {
  if (!hash) return null;
  const trimmed = hash.replace(/^#/, '');
  if (!trimmed) return null;

  for (const segment of trimmed.split('&')) {
    const eq = segment.indexOf('=');
    if (eq < 0) continue;
    if (segment.slice(0, eq) !== SHARE_HASH_KEY) continue;
    try {
      const decoded = decodeURIComponent(segment.slice(eq + 1));
      if (/^https?:\/\//i.test(decoded)) {
        return decoded;
      }
    } catch {
      return null;
    }
  }
  return null;
}

export async function fetchSharedContent(url: string): Promise<string> {
  let response: Response;
  try {
    response = await fetch(url);
  } catch (error) {
    throw new Error(
      `获取分享内容失败：${error instanceof Error ? error.message : String(error)}`
    );
  }
  if (!response.ok) {
    throw new Error(`获取分享内容失败：HTTP ${response.status}`);
  }

  const buffer = await response.arrayBuffer();
  if (buffer.byteLength > MAX_FETCH_BYTES) {
    throw new Error('分享内容过大，已拒绝加载');
  }
  return new TextDecoder('utf-8', { fatal: false }).decode(buffer);
}

function sanitizeFilename(name: string): string {
  const cleaned = name.trim().replace(/[^\w.\-]/g, '_');
  return cleaned || SHARE_FILENAME;
}
