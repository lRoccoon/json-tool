import test from 'node:test';
import assert from 'node:assert/strict';
import {
  diffChars,
  diffJson,
  numberEqualsWithPrecision,
  summarizeDiff,
  type DiffNode,
} from './jsonDiff.ts';

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

test('diffChars 相同字符串只产出一个 equal 片段', () => {
  assert.deepEqual(diffChars('abc', 'abc'), [{ type: 'equal', value: 'abc' }]);
});

test('diffChars 标出公共前缀后变化的字符', () => {
  // "100" → "200"：公共子序列 "00"，仅首字符不同
  assert.deepEqual(diffChars('100', '200'), [
    { type: 'del', value: '1' },
    { type: 'add', value: '2' },
    { type: 'equal', value: '00' },
  ]);
});

test('diffChars 无公共字符时整体 del + 整体 add', () => {
  assert.deepEqual(diffChars('18', '20'), [
    { type: 'del', value: '18' },
    { type: 'add', value: '20' },
  ]);
});

test('diffChars 处理中间插入', () => {
  // "ac" → "abc"：插入 b
  assert.deepEqual(diffChars('ac', 'abc'), [
    { type: 'equal', value: 'a' },
    { type: 'add', value: 'b' },
    { type: 'equal', value: 'c' },
  ]);
});

test('numberEqualsWithPrecision 按小数位四舍五入判等', () => {
  const eq3 = numberEqualsWithPrecision(3);
  assert.equal(eq3(3.14159, 3.14162), true); // 都是 3.142
  assert.equal(eq3(3.14159, 3.14252), false); // 3.142 vs 3.143
  const eq0 = numberEqualsWithPrecision(0);
  assert.equal(eq0(1.4, 1.49), true); // 都是 1
  assert.equal(eq0(1.4, 1.6), false); // 1 vs 2
});

test('diffJson 在数字精度内将微小差异判为 unchanged', () => {
  const a = { v: 3.14159, n: 100 };
  const b = { v: 3.14162, n: 100 };
  // 精确比较：v 改变
  assert.equal(child(diffJson(a, b, noNested), 'v').status, 'changed');
  // 3 位精度：v 在精度内 → unchanged
  const within = diffJson(a, b, {
    shouldParseNested: () => false,
    numberEquals: numberEqualsWithPrecision(3),
  });
  assert.equal(child(within, 'v').status, 'unchanged');
  assert.equal(child(within, 'n').status, 'unchanged');
  // 5 位精度：差异超出精度 → changed
  const beyond = diffJson(a, b, {
    shouldParseNested: () => false,
    numberEquals: numberEqualsWithPrecision(5),
  });
  assert.equal(child(beyond, 'v').status, 'changed');
});
