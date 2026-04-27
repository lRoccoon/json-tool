export const SHARE_ENDPOINT_KEY = 'json-tool:share-endpoint:v1';
export const DEFAULT_SHARE_ENDPOINT = 'https://t.herf.cc';

export function normalizeShareEndpoint(value: string): string {
  return value.trim().replace(/\/+$/, '');
}

export function isValidShareEndpoint(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed) return false;
  try {
    const url = new URL(trimmed);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

export function loadShareEndpoint(): string {
  if (typeof window === 'undefined') return DEFAULT_SHARE_ENDPOINT;
  try {
    const raw = window.localStorage.getItem(SHARE_ENDPOINT_KEY);
    if (raw && isValidShareEndpoint(raw)) {
      return normalizeShareEndpoint(raw);
    }
  } catch {
    // Ignore storage failures and fall back to default.
  }
  return DEFAULT_SHARE_ENDPOINT;
}

export function saveShareEndpoint(value: string): string {
  const next = isValidShareEndpoint(value)
    ? normalizeShareEndpoint(value)
    : DEFAULT_SHARE_ENDPOINT;
  try {
    window.localStorage.setItem(SHARE_ENDPOINT_KEY, next);
  } catch {
    // Ignore — endpoint will revert to default on next load.
  }
  return next;
}
