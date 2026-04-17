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
    if (code > 0x7e || code < 0x20) {
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
