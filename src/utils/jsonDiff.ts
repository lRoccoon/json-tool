import {
  encodeJsonPathSegment,
  isLikelyJsonString,
  tryParseJson,
  type JsonValue,
} from './jsonUtils.ts';

export type DiffStatus =
  | 'unchanged'
  | 'added'
  | 'removed'
  | 'changed'
  | 'children';

export interface DiffNode {
  key: string | number | null;
  path: string;
  status: DiffStatus;
  left?: JsonValue;
  right?: JsonValue;
  kind?: 'object' | 'array';
  children?: DiffNode[];
  nestedParsed?: boolean;
}

export interface DiffOptions {
  shouldParseNested: (path: string) => boolean;
}

function isContainer(v: JsonValue): boolean {
  return v !== null && typeof v === 'object';
}

function diffValue(
  left: JsonValue,
  right: JsonValue,
  key: string | number | null,
  path: string,
  options: DiffOptions
): DiffNode {
  if (
    typeof left === 'string' &&
    typeof right === 'string' &&
    options.shouldParseNested(path) &&
    isLikelyJsonString(left) &&
    isLikelyJsonString(right)
  ) {
    const pl = tryParseJson(left);
    const pr = tryParseJson(right);
    if (pl.ok && pr.ok) {
      const node = diffValue(
        pl.value as JsonValue,
        pr.value as JsonValue,
        key,
        path,
        options
      );
      // nestedParsed 表示两侧字符串已按 JSON 解析后再比较，与比较结果无关（结果为 unchanged 时也为 true）。
      return { ...node, nestedParsed: true };
    }
  }

  const leftArr = Array.isArray(left);
  const rightArr = Array.isArray(right);

  if (leftArr && rightArr) {
    return diffArray(left as JsonValue[], right as JsonValue[], key, path, options);
  }
  if (!leftArr && !rightArr && isContainer(left) && isContainer(right)) {
    return diffObject(
      left as Record<string, JsonValue>,
      right as Record<string, JsonValue>,
      key,
      path,
      options
    );
  }

  // 走到这里只剩混合类型（数组 vs 对象 / 容器 vs 基础值）或两个基础值。
  // 两个不同的对象/数组引用 === 永远为 false，所以混合类型自然落入 'changed'。
  return { key, path, status: left === right ? 'unchanged' : 'changed', left, right };
}

function diffObject(
  left: Record<string, JsonValue>,
  right: Record<string, JsonValue>,
  key: string | number | null,
  path: string,
  options: DiffOptions
): DiffNode {
  const keys: string[] = [];
  const seen = new Set<string>();
  for (const k of Object.keys(left)) {
    keys.push(k);
    seen.add(k);
  }
  for (const k of Object.keys(right)) {
    if (!seen.has(k)) keys.push(k);
  }

  const children: DiffNode[] = [];
  let changed = false;
  for (const k of keys) {
    const childPath = path + '/' + encodeJsonPathSegment(k);
    const inL = Object.prototype.hasOwnProperty.call(left, k);
    const inR = Object.prototype.hasOwnProperty.call(right, k);
    if (inL && inR) {
      const node = diffValue(left[k], right[k], k, childPath, options);
      if (node.status !== 'unchanged') changed = true;
      children.push(node);
    } else if (inL) {
      children.push({ key: k, path: childPath, status: 'removed', left: left[k] });
      changed = true;
    } else {
      children.push({ key: k, path: childPath, status: 'added', right: right[k] });
      changed = true;
    }
  }

  return {
    key,
    path,
    status: changed ? 'children' : 'unchanged',
    kind: 'object',
    children,
  };
}

function diffArray(
  left: JsonValue[],
  right: JsonValue[],
  key: string | number | null,
  path: string,
  options: DiffOptions
): DiffNode {
  const len = Math.max(left.length, right.length);
  const children: DiffNode[] = [];
  let changed = false;
  for (let i = 0; i < len; i++) {
    const childPath = path + '/' + encodeJsonPathSegment(i);
    const inL = i < left.length;
    const inR = i < right.length;
    if (inL && inR) {
      const node = diffValue(left[i], right[i], i, childPath, options);
      if (node.status !== 'unchanged') changed = true;
      children.push(node);
    } else if (inL) {
      children.push({ key: i, path: childPath, status: 'removed', left: left[i] });
      changed = true;
    } else {
      children.push({ key: i, path: childPath, status: 'added', right: right[i] });
      changed = true;
    }
  }

  return {
    key,
    path,
    status: changed ? 'children' : 'unchanged',
    kind: 'array',
    children,
  };
}

export function diffJson(
  a: JsonValue,
  b: JsonValue,
  options: DiffOptions
): DiffNode {
  return diffValue(a, b, null, '', options);
}

export interface DiffSummary {
  added: number;
  removed: number;
  changed: number;
}

export function summarizeDiff(root: DiffNode): DiffSummary {
  let added = 0;
  let removed = 0;
  let changed = 0;
  const walk = (n: DiffNode) => {
    if (n.status === 'added') added++;
    else if (n.status === 'removed') removed++;
    else if (n.status === 'changed') changed++;
    if (n.children) for (const c of n.children) walk(c);
  };
  walk(root);
  return { added, removed, changed };
}

export type CharSegmentType = 'equal' | 'del' | 'add';

export interface CharSegment {
  type: CharSegmentType;
  value: string;
}

// 超过该长度（两侧之一）则跳过字符级 diff，避免 O(n*m) 退化。
const CHAR_DIFF_LIMIT = 2000;

/**
 * 对两个字符串做字符级 diff（最长公共子序列），返回有序的片段列表：
 * - `equal` 两侧都有；`del` 仅左侧（A）有；`add` 仅右侧（B）有。
 * 左侧渲染 equal+del，右侧渲染 equal+add，即可逐字符高亮变化。
 * 任一侧过长时退化为「整体 del + 整体 add」，避免性能问题。
 */
export function diffChars(a: string, b: string): CharSegment[] {
  if (a === b) return a ? [{ type: 'equal', value: a }] : [];

  const n = a.length;
  const m = b.length;

  const segs: CharSegment[] = [];
  const push = (type: CharSegmentType, ch: string) => {
    const last = segs[segs.length - 1];
    if (last && last.type === type) last.value += ch;
    else segs.push({ type, value: ch });
  };

  if (n > CHAR_DIFF_LIMIT || m > CHAR_DIFF_LIMIT) {
    if (a) push('del', a);
    if (b) push('add', b);
    return segs;
  }

  // dp[i][j] = LCS 长度（a[i:] 与 b[j:]）
  const dp: number[][] = Array.from({ length: n + 1 }, () =>
    new Array<number>(m + 1).fill(0)
  );
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      dp[i][j] =
        a[i] === b[j]
          ? dp[i + 1][j + 1] + 1
          : Math.max(dp[i + 1][j], dp[i][j + 1]);
    }
  }

  let i = 0;
  let j = 0;
  while (i < n && j < m) {
    if (a[i] === b[j]) {
      push('equal', a[i]);
      i++;
      j++;
    } else if (dp[i + 1][j] >= dp[i][j + 1]) {
      push('del', a[i]);
      i++;
    } else {
      push('add', b[j]);
      j++;
    }
  }
  while (i < n) push('del', a[i++]);
  while (j < m) push('add', b[j++]);
  return segs;
}
