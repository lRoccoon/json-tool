import test from 'node:test';
import assert from 'node:assert/strict';
import { diffJson, summarizeDiff, type DiffNode } from './jsonDiff.ts';

const noNested = { shouldParseNested: () => false };
const allNested = { shouldParseNested: () => true };

function child(node: DiffNode, key: string | number): DiffNode {
  const found = node.children?.find((c) => c.key === key);
  assert.ok(found, `expected child ${key}`);
  return found as DiffNode;
}

test('diffJson 标记新增与删除的对象 key', () => {
  const d = diffJson({ a: 1, b: 2 }, { a: 1, c: 3 }, noNested);
  assert.equal(d.status, 'children');
  assert.equal(child(d, 'a').status, 'unchanged');
  assert.equal(child(d, 'b').status, 'removed');
  assert.equal(child(d, 'c').status, 'added');
});

test('diffJson 标记基础值修改', () => {
  const d = diffJson({ a: 1 }, { a: 2 }, noNested);
  const a = child(d, 'a');
  assert.equal(a.status, 'changed');
  assert.equal(a.left, 1);
  assert.equal(a.right, 2);
});

test('diffJson 对象 key 顺序无关', () => {
  const d = diffJson({ a: 1, b: 2 }, { b: 2, a: 1 }, noNested);
  assert.equal(d.status, 'unchanged');
});

test('diffJson 类型变化记为 changed', () => {
  const d = diffJson({ a: 1 }, { a: '1' }, noNested);
  assert.equal(child(d, 'a').status, 'changed');
});

test('diffJson 基础值变容器记为 changed', () => {
  const d = diffJson({ a: 1 }, { a: { x: 1 } }, noNested);
  const a = child(d, 'a');
  assert.equal(a.status, 'changed');
  assert.deepEqual(a.right, { x: 1 });
});

test('diffJson 数组按下标比较，尾部新增', () => {
  const d = diffJson([1, 2], [1, 2, 3], noNested);
  assert.equal(d.status, 'children');
  assert.equal(child(d, 0).status, 'unchanged');
  assert.equal(child(d, 2).status, 'added');
});

test('diffJson 数组按下标比较，尾部删除 + 中间修改', () => {
  const d = diffJson([1, 2, 3], [1, 9], noNested);
  assert.equal(child(d, 1).status, 'changed');
  assert.equal(child(d, 2).status, 'removed');
});

test('diffJson 开启嵌套解析后递归比较 JSON 字符串', () => {
  const a = { payload: JSON.stringify({ n: 1 }) };
  const b = { payload: JSON.stringify({ n: 2 }) };
  assert.equal(child(diffJson(a, b, noNested), 'payload').status, 'changed');

  const payload = child(diffJson(a, b, allNested), 'payload');
  assert.equal(payload.status, 'children');
  assert.equal(payload.nestedParsed, true);
  assert.equal(child(payload, 'n').status, 'changed');
});

test('diffJson 嵌套解析失败时回退字符串比较', () => {
  const d = diffJson({ a: 'not json' }, { a: 'also not' }, allNested);
  assert.equal(child(d, 'a').status, 'changed');
});

test('summarizeDiff 统计增删改', () => {
  const d = diffJson({ a: 1, b: 2, c: 3 }, { a: 9, c: 3, e: 5 }, noNested);
  assert.deepEqual(summarizeDiff(d), { added: 1, removed: 1, changed: 1 });
});

test('diffJson 递归比较普通嵌套对象', () => {
  const d = diffJson({ a: { x: 1, y: 2 } }, { a: { x: 9, y: 2 } }, noNested);
  const a = child(d, 'a');
  assert.equal(a.status, 'children');
  assert.equal(child(a, 'x').status, 'changed');
  assert.equal(child(a, 'y').status, 'unchanged');
});

test('diffJson 解析后同内容的不同格式 JSON 字符串判为 unchanged 且保留 nestedParsed', () => {
  const a = { p: '{"n":1}' };
  const b = { p: '{ "n": 1 }' };
  assert.equal(child(diffJson(a, b, noNested), 'p').status, 'changed');
  const p = child(diffJson(a, b, allNested), 'p');
  assert.equal(p.status, 'unchanged');
  assert.equal(p.nestedParsed, true);
});

test('summarizeDiff 不计入 children 容器本身，只计叶子', () => {
  const d = diffJson({ a: { b: 1 }, c: 1 }, { a: { b: 2 }, c: 1 }, noNested);
  assert.deepEqual(summarizeDiff(d), { added: 0, removed: 0, changed: 1 });
});
