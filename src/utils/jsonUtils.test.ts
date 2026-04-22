import test from 'node:test';
import assert from 'node:assert/strict';
import { deleteJsonAtPath } from './jsonUtils.ts';

test('deleteJsonAtPath removes an object property', () => {
  const source = {
    name: 'json-tool',
    version: '0.2.0',
    nested: {
      enabled: true,
    },
  };

  const result = deleteJsonAtPath(source, '/version') as typeof source;

  assert.deepEqual(result, {
    name: 'json-tool',
    nested: {
      enabled: true,
    },
  });
});

test('deleteJsonAtPath removes an array item', () => {
  const source = {
    items: ['a', 'b', 'c'],
  };

  const result = deleteJsonAtPath(source, '/items/1') as typeof source;

  assert.deepEqual(result, {
    items: ['a', 'c'],
  });
});

test('deleteJsonAtPath updates nested parsed JSON strings', () => {
  const source = {
    payload: JSON.stringify({
      user: {
        id: 1,
        name: 'Ada',
      },
      active: true,
    }),
  };

  const result = deleteJsonAtPath(source, '/payload/user/name') as typeof source;

  assert.deepEqual(JSON.parse(result.payload), {
    user: {
      id: 1,
    },
    active: true,
  });
});

test('deleteJsonAtPath supports encoded keys with slashes', () => {
  const source = {
    'a/b': {
      keep: true,
      remove: false,
    },
  };

  const result = deleteJsonAtPath(source, '/a~1b/remove') as typeof source;

  assert.deepEqual(result, {
    'a/b': {
      keep: true,
    },
  });
});

test('deleteJsonAtPath is a no-op for the root path', () => {
  const source = {
    keep: true,
  };

  assert.equal(deleteJsonAtPath(source, ''), source);
});

test('deleteJsonAtPath is a no-op for unknown paths', () => {
  const source = {
    keep: true,
  };

  assert.equal(deleteJsonAtPath(source, '/missing'), source);
});
