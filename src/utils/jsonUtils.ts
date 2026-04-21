export type ParseResult<T = unknown> =
  | { ok: true; value: T }
  | { ok: false; error: string };

export function tryParseJson(text: string): ParseResult {
  try {
    return { ok: true, value: JSON.parse(text) };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}

export function formatJson(text: string, indent = 2): string {
  return JSON.stringify(JSON.parse(text), null, indent);
}

export function compressJson(text: string): string {
  return JSON.stringify(JSON.parse(text));
}

export function unicodeToChinese(text: string): string {
  return text.replace(/\\u([0-9a-fA-F]{4})/g, (_m, hex: string) => {
    const code = parseInt(hex, 16);
    return String.fromCharCode(code);
  });
}

export function chineseToUnicode(text: string): string {
  let out = '';
  for (const ch of text) {
    const code = ch.codePointAt(0)!;
    if (code > 0x7e) {
      if (code <= 0xffff) {
        out += '\\u' + code.toString(16).padStart(4, '0');
      } else {
        const high = 0xd800 + ((code - 0x10000) >> 10);
        const low = 0xdc00 + ((code - 0x10000) & 0x3ff);
        out +=
          '\\u' +
          high.toString(16).padStart(4, '0') +
          '\\u' +
          low.toString(16).padStart(4, '0');
      }
    } else {
      out += ch;
    }
  }
  return out;
}

export function escapeString(text: string): string {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r')
    .replace(/\t/g, '\\t')
    .replace(/\f/g, '\\f')
    .replace(/\u0008/g, '\\b');
}

export function unescapeString(text: string): string {
  let s = text;
  if (
    s.length >= 2 &&
    ((s.startsWith('"') && s.endsWith('"')) ||
      (s.startsWith("'") && s.endsWith("'")))
  ) {
    s = s.slice(1, -1);
  }
  return s.replace(
    /\\(["'\\\/bfnrt]|u[0-9a-fA-F]{4})/g,
    (m, g1: string) => {
      switch (g1[0]) {
        case '"':
          return '"';
        case "'":
          return "'";
        case '\\':
          return '\\';
        case '/':
          return '/';
        case 'b':
          return '\b';
        case 'f':
          return '\f';
        case 'n':
          return '\n';
        case 'r':
          return '\r';
        case 't':
          return '\t';
        case 'u':
          return String.fromCharCode(parseInt(g1.slice(1), 16));
        default:
          return m;
      }
    }
  );
}

export function isLikelyJsonString(value: unknown): boolean {
  if (typeof value !== 'string') return false;
  const trimmed = value.trim();
  if (trimmed.length < 2) return false;
  const first = trimmed[0];
  const last = trimmed[trimmed.length - 1];
  if (!((first === '{' && last === '}') || (first === '[' && last === ']'))) {
    return false;
  }
  try {
    JSON.parse(trimmed);
    return true;
  } catch {
    return false;
  }
}

export type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue };

export type SearchScope = 'all' | 'key' | 'value';
export type SortKeysMode = 'none' | 'asc' | 'desc';

export interface MatchResult {
  matches: string[];
  ancestors: Set<string>;
}

export function sortObjectEntries<T>(
  entries: [string, T][],
  mode: SortKeysMode
): [string, T][] {
  if (mode === 'none') return entries;
  const sorted = entries.slice().sort((a, b) => a[0].localeCompare(b[0]));
  return mode === 'asc' ? sorted : sorted.reverse();
}

export function encodeJsonPathSegment(segment: string | number): string {
  return String(segment).replace(/~/g, '~0').replace(/\//g, '~1');
}

export function collectMatches(
  value: unknown,
  scope: SearchScope,
  query: string,
  sortMode: SortKeysMode = 'none'
): MatchResult {
  const matches: string[] = [];
  const ancestors = new Set<string>();
  const q = query.trim().toLowerCase();
  if (!q) return { matches, ancestors };

  const walk = (
    v: unknown,
    path: string,
    keyLabel: string | number | null,
    stack: string[]
  ) => {
    const keyIsString = typeof keyLabel === 'string';
    const keyMatch =
      scope !== 'value' && keyIsString &&
      (keyLabel as string).toLowerCase().includes(q);

    let nestedContainer: unknown = null;
    if (typeof v === 'string' && isLikelyJsonString(v)) {
      const res = tryParseJson(v);
      if (res.ok && res.value !== null && typeof res.value === 'object') {
        nestedContainer = res.value;
      }
    }

    const isPrimitive =
      v === null ||
      typeof v === 'string' ||
      typeof v === 'number' ||
      typeof v === 'boolean';
    const valueMatch =
      scope !== 'key' &&
      isPrimitive &&
      nestedContainer === null &&
      String(v).toLowerCase().includes(q);

    if (keyMatch || valueMatch) {
      matches.push(path);
      for (const p of stack) ancestors.add(p);
    }

    if (Array.isArray(v)) {
      const next = stack.concat(path);
      v.forEach((child, i) =>
        walk(child, `${path}/${encodeJsonPathSegment(i)}`, i, next)
      );
    } else if (v !== null && typeof v === 'object') {
      const next = stack.concat(path);
      const entries = sortObjectEntries(
        Object.entries(v as Record<string, unknown>),
        sortMode
      );
      for (const [k, child] of entries) {
        walk(child, `${path}/${encodeJsonPathSegment(k)}`, k, next);
      }
    } else if (nestedContainer !== null) {
      const next = stack.concat(path);
      if (Array.isArray(nestedContainer)) {
        nestedContainer.forEach((child, i) =>
          walk(child, `${path}/${encodeJsonPathSegment(i)}`, i, next)
        );
      } else {
        const entries = sortObjectEntries(
          Object.entries(nestedContainer as Record<string, unknown>),
          sortMode
        );
        for (const [k, child] of entries) {
          walk(child, `${path}/${encodeJsonPathSegment(k)}`, k, next);
        }
      }
    }
  };

  walk(value, '', null, []);
  return { matches, ancestors };
}

function parsePath(path: string): string[] {
  if (!path) {
    return [];
  }

  return path
    .split('/')
    .filter(Boolean)
    .map((segment) => segment.replace(/~1/g, '/').replace(/~0/g, '~'));
}

function deleteAtSegments(value: unknown, segments: string[]): unknown {
  if (segments.length === 0) {
    return value;
  }

  const [head, ...rest] = segments;

  if (Array.isArray(value)) {
    const index = Number(head);
    if (!Number.isInteger(index) || index < 0 || index >= value.length) {
      return value;
    }

    if (rest.length === 0) {
      return value.filter((_, currentIndex) => currentIndex !== index);
    }

    const nextChild = deleteAtSegments(value[index], rest);
    if (nextChild === value[index]) {
      return value;
    }

    const nextArray = value.slice();
    nextArray[index] = nextChild;
    return nextArray;
  }

  if (value !== null && typeof value === 'object') {
    const record = value as Record<string, unknown>;
    if (!Object.prototype.hasOwnProperty.call(record, head)) {
      return value;
    }

    if (rest.length === 0) {
      const { [head]: _removed, ...remaining } = record;
      return remaining;
    }

    const currentChild = record[head];
    const nextChild = deleteAtSegments(currentChild, rest);
    if (nextChild === currentChild) {
      return value;
    }

    return {
      ...record,
      [head]: nextChild,
    };
  }

  if (typeof value === 'string' && isLikelyJsonString(value)) {
    const parsed = tryParseJson(value);
    if (
      !parsed.ok ||
      parsed.value === null ||
      (typeof parsed.value !== 'object' && !Array.isArray(parsed.value))
    ) {
      return value;
    }

    const nextNested = deleteAtSegments(parsed.value, segments);
    if (nextNested === parsed.value) {
      return value;
    }

    return JSON.stringify(nextNested);
  }

  return value;
}

export function deleteJsonAtPath(value: unknown, path: string): unknown {
  const segments = parsePath(path);
  if (segments.length === 0) {
    return value;
  }

  return deleteAtSegments(value, segments);
}
