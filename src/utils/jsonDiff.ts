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

  const equal = !isContainer(left) && !isContainer(right) && left === right;
  return { key, path, status: equal ? 'unchanged' : 'changed', left, right };
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
