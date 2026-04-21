export interface HistoryEntry {
  id: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  size: number;
}

export interface HistoryStore {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
  removeItem: (key: string) => void;
}

export const HISTORY_STORAGE_KEY = 'json-tool:history:v1';
export const MAX_HISTORY_ENTRIES = 20;

function getDefaultStore(): HistoryStore | null {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function createHistoryId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  return `history-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function isHistoryEntry(value: unknown): value is HistoryEntry {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const entry = value as Partial<HistoryEntry>;
  return (
    typeof entry.id === 'string' &&
    typeof entry.content === 'string' &&
    typeof entry.createdAt === 'string' &&
    typeof entry.updatedAt === 'string' &&
    typeof entry.size === 'number'
  );
}

function normalizeHistoryEntry(entry: HistoryEntry): HistoryEntry {
  return {
    ...entry,
    size: entry.content.length,
  };
}

function persistHistory(entries: HistoryEntry[], store: HistoryStore | null): void {
  if (!store) {
    return;
  }

  try {
    if (entries.length === 0) {
      store.removeItem(HISTORY_STORAGE_KEY);
      return;
    }

    store.setItem(HISTORY_STORAGE_KEY, JSON.stringify(entries));
  } catch {
    // Ignore persistence failures so the editor remains usable.
  }
}

export function parseHistoryEntries(raw: string | null): HistoryEntry[] {
  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed
      .filter(isHistoryEntry)
      .map(normalizeHistoryEntry)
      .slice(0, MAX_HISTORY_ENTRIES);
  } catch {
    return [];
  }
}

export function loadHistory(
  store: HistoryStore | null = getDefaultStore()
): HistoryEntry[] {
  if (!store) {
    return [];
  }

  try {
    return parseHistoryEntries(store.getItem(HISTORY_STORAGE_KEY));
  } catch {
    return [];
  }
}

export function upsertHistoryEntries(
  entries: HistoryEntry[],
  content: string,
  now: Date = new Date()
): HistoryEntry[] {
  if (!content.trim()) {
    return entries;
  }

  const timestamp = now.toISOString();
  const existing = entries.find((entry) => entry.content === content);

  const nextEntry: HistoryEntry = {
    id: existing?.id ?? createHistoryId(),
    content,
    createdAt: existing?.createdAt ?? timestamp,
    updatedAt: timestamp,
    size: content.length,
  };

  return [nextEntry, ...entries.filter((entry) => entry.content !== content)].slice(
    0,
    MAX_HISTORY_ENTRIES
  );
}

export function saveHistoryEntry(
  content: string,
  store: HistoryStore | null = getDefaultStore(),
  now: Date = new Date()
): HistoryEntry[] {
  const nextEntries = upsertHistoryEntries(loadHistory(store), content, now);
  persistHistory(nextEntries, store);
  return nextEntries;
}

export function removeHistoryEntry(
  id: string,
  store: HistoryStore | null = getDefaultStore()
): HistoryEntry[] {
  const nextEntries = loadHistory(store).filter((entry) => entry.id !== id);
  persistHistory(nextEntries, store);
  return nextEntries;
}

export function clearHistory(
  store: HistoryStore | null = getDefaultStore()
): HistoryEntry[] {
  persistHistory([], store);
  return [];
}

export function getHistoryPreview(content: string): string {
  const firstLine = content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .find(Boolean);

  const preview = (firstLine ?? content.trim()).replace(/\s+/g, ' ');
  if (!preview) {
    return '空白记录';
  }

  return preview.length > 88 ? `${preview.slice(0, 87)}…` : preview;
}

export function formatHistoryTimestamp(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '时间未知';
  }

  return new Intl.DateTimeFormat(undefined, {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}
