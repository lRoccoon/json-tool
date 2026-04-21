import test from 'node:test';
import assert from 'node:assert/strict';
import {
  HISTORY_STORAGE_KEY,
  MAX_HISTORY_ENTRIES,
  clearHistory,
  loadHistory,
  removeHistoryEntry,
  saveHistoryEntry,
  upsertHistoryEntries,
  type HistoryStore,
} from './historyStore.ts';

function createMockStore(initial: Record<string, string> = {}): HistoryStore {
  const storage = new Map(Object.entries(initial));

  return {
    getItem(key) {
      return storage.get(key) ?? null;
    },
    setItem(key, value) {
      storage.set(key, value);
    },
    removeItem(key) {
      storage.delete(key);
    },
  };
}

test('saveHistoryEntry ignores blank input', () => {
  const store = createMockStore();

  const entries = saveHistoryEntry(
    '   \n  ',
    store,
    new Date('2026-04-21T10:00:00.000Z')
  );

  assert.deepEqual(entries, []);
  assert.equal(store.getItem(HISTORY_STORAGE_KEY), null);
});

test('saveHistoryEntry inserts new content at the top', () => {
  const store = createMockStore();

  const entries = saveHistoryEntry(
    '{"name":"json-tool"}',
    store,
    new Date('2026-04-21T10:00:00.000Z')
  );

  assert.equal(entries.length, 1);
  assert.equal(entries[0]?.content, '{"name":"json-tool"}');
  assert.equal(entries[0]?.size, '{"name":"json-tool"}'.length);
  assert.deepEqual(loadHistory(store), entries);
});

test('saveHistoryEntry deduplicates content and refreshes updatedAt', () => {
  const store = createMockStore();

  const first = saveHistoryEntry(
    '{"id":1}',
    store,
    new Date('2026-04-21T10:00:00.000Z')
  );
  const second = saveHistoryEntry(
    '{"id":2}',
    store,
    new Date('2026-04-21T11:00:00.000Z')
  );
  const third = saveHistoryEntry(
    '{"id":1}',
    store,
    new Date('2026-04-21T12:00:00.000Z')
  );

  assert.equal(first[0]?.createdAt, third[0]?.createdAt);
  assert.equal(third[0]?.updatedAt, '2026-04-21T12:00:00.000Z');
  assert.equal(third[0]?.content, '{"id":1}');
  assert.equal(third[1]?.content, second[0]?.content);
  assert.equal(third.length, 2);
});

test('upsertHistoryEntries trims the list to the maximum size', () => {
  const now = new Date('2026-04-21T10:00:00.000Z');
  let entries = [] as ReturnType<typeof loadHistory>;

  for (let index = 0; index < MAX_HISTORY_ENTRIES + 5; index += 1) {
    entries = upsertHistoryEntries(entries, `{"index":${index}}`, now);
  }

  assert.equal(entries.length, MAX_HISTORY_ENTRIES);
  assert.equal(entries[0]?.content, '{"index":24}');
  assert.equal(entries.at(-1)?.content, '{"index":5}');
});

test('loadHistory falls back to an empty list for invalid JSON', () => {
  const store = createMockStore({
    [HISTORY_STORAGE_KEY]: '{invalid-json',
  });

  assert.deepEqual(loadHistory(store), []);
});

test('removeHistoryEntry and clearHistory update the persisted list', () => {
  const store = createMockStore();

  const older = saveHistoryEntry(
    '{"older":true}',
    store,
    new Date('2026-04-21T11:00:00.000Z')
  )[0];
  const latest = saveHistoryEntry(
    '{"fresh":true}',
    store,
    new Date('2026-04-21T12:00:00.000Z')
  )[0];

  const afterRemove = removeHistoryEntry(latest!.id, store);
  assert.equal(afterRemove.length, 1);
  assert.equal(afterRemove[0]?.id, older?.id);

  const afterClear = clearHistory(store);
  assert.deepEqual(afterClear, []);
  assert.equal(store.getItem(HISTORY_STORAGE_KEY), null);
});
