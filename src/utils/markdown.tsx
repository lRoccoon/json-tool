import type { ReactNode } from 'react';

type Block =
  | { type: 'heading'; level: number; text: string }
  | { type: 'paragraph'; text: string }
  | { type: 'code'; lang: string; text: string }
  | { type: 'quote'; lines: string[] }
  | { type: 'ul'; items: string[] }
  | { type: 'ol'; items: string[] }
  | { type: 'hr' };

function isSafeUrl(url: string): boolean {
  const trimmed = url.trim();
  if (!trimmed) return false;
  if (/^(https?:|mailto:)/i.test(trimmed)) return true;
  if (trimmed.startsWith('/') || trimmed.startsWith('#')) return true;
  if (/^[a-zA-Z][\w./?#@:%+~=-]*$/.test(trimmed) && !trimmed.includes(':'))
    return true;
  return false;
}

function parseBlocks(src: string): Block[] {
  const lines = src.replace(/\r\n?/g, '\n').split('\n');
  const blocks: Block[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (!line.trim()) {
      i++;
      continue;
    }

    const fence = line.match(/^```\s*([\w.+-]*)\s*$/);
    if (fence) {
      const lang = fence[1] ?? '';
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !/^```\s*$/.test(lines[i])) {
        codeLines.push(lines[i]);
        i++;
      }
      if (i < lines.length) i++;
      blocks.push({ type: 'code', lang, text: codeLines.join('\n') });
      continue;
    }

    if (/^\s*(?:---+|\*\*\*+|___+)\s*$/.test(line)) {
      blocks.push({ type: 'hr' });
      i++;
      continue;
    }

    const heading = line.match(/^(#{1,6})\s+(.+?)\s*#*\s*$/);
    if (heading) {
      blocks.push({
        type: 'heading',
        level: heading[1].length,
        text: heading[2],
      });
      i++;
      continue;
    }

    if (/^\s*>/.test(line)) {
      const quoteLines: string[] = [];
      while (i < lines.length && /^\s*>/.test(lines[i])) {
        quoteLines.push(lines[i].replace(/^\s*>\s?/, ''));
        i++;
      }
      blocks.push({ type: 'quote', lines: quoteLines });
      continue;
    }

    if (/^\s*[-*+]\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\s*[-*+]\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^\s*[-*+]\s+/, ''));
        i++;
      }
      blocks.push({ type: 'ul', items });
      continue;
    }

    if (/^\s*\d+\.\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\s*\d+\.\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^\s*\d+\.\s+/, ''));
        i++;
      }
      blocks.push({ type: 'ol', items });
      continue;
    }

    const paraLines: string[] = [line];
    i++;
    while (
      i < lines.length &&
      lines[i].trim() &&
      !/^#{1,6}\s+/.test(lines[i]) &&
      !/^```/.test(lines[i]) &&
      !/^\s*>/.test(lines[i]) &&
      !/^\s*[-*+]\s+/.test(lines[i]) &&
      !/^\s*\d+\.\s+/.test(lines[i]) &&
      !/^\s*(?:---+|\*\*\*+|___+)\s*$/.test(lines[i])
    ) {
      paraLines.push(lines[i]);
      i++;
    }
    blocks.push({ type: 'paragraph', text: paraLines.join('\n') });
  }

  return blocks;
}

interface InlineToken {
  type: 'text' | 'code' | 'bold' | 'italic' | 'link' | 'break';
  text?: string;
  url?: string;
  children?: InlineToken[];
}

function parseInline(text: string): InlineToken[] {
  const tokens: InlineToken[] = [];
  let i = 0;

  const pushText = (s: string) => {
    if (!s) return;
    const parts = s.split(/( {2,}\n|\n)/);
    for (const part of parts) {
      if (!part) continue;
      if (/^ {2,}\n$/.test(part) || part === '\n') {
        tokens.push({ type: 'break' });
      } else {
        tokens.push({ type: 'text', text: part });
      }
    }
  };

  let buffer = '';
  while (i < text.length) {
    const ch = text[i];

    if (ch === '\\' && i + 1 < text.length) {
      buffer += text[i + 1];
      i += 2;
      continue;
    }

    if (ch === '`') {
      const end = text.indexOf('`', i + 1);
      if (end !== -1) {
        pushText(buffer);
        buffer = '';
        tokens.push({ type: 'code', text: text.slice(i + 1, end) });
        i = end + 1;
        continue;
      }
    }

    if (ch === '*' && text[i + 1] === '*') {
      const end = text.indexOf('**', i + 2);
      if (end !== -1) {
        pushText(buffer);
        buffer = '';
        tokens.push({
          type: 'bold',
          children: parseInline(text.slice(i + 2, end)),
        });
        i = end + 2;
        continue;
      }
    }

    if ((ch === '*' || ch === '_') && text[i + 1] !== ch) {
      const end = text.indexOf(ch, i + 1);
      if (end !== -1 && end > i + 1) {
        pushText(buffer);
        buffer = '';
        tokens.push({
          type: 'italic',
          children: parseInline(text.slice(i + 1, end)),
        });
        i = end + 1;
        continue;
      }
    }

    if (ch === '[') {
      const close = text.indexOf(']', i + 1);
      if (close !== -1 && text[close + 1] === '(') {
        const urlEnd = text.indexOf(')', close + 2);
        if (urlEnd !== -1) {
          const label = text.slice(i + 1, close);
          const url = text.slice(close + 2, urlEnd);
          pushText(buffer);
          buffer = '';
          tokens.push({
            type: 'link',
            url,
            children: parseInline(label),
          });
          i = urlEnd + 1;
          continue;
        }
      }
    }

    buffer += ch;
    i++;
  }

  pushText(buffer);
  return tokens;
}

function renderInline(tokens: InlineToken[], keyPrefix: string): ReactNode[] {
  return tokens.map((t, idx) => {
    const key = `${keyPrefix}-${idx}`;
    switch (t.type) {
      case 'text':
        return <span key={key}>{t.text}</span>;
      case 'break':
        return <br key={key} />;
      case 'code':
        return (
          <code key={key} className="md-code-inline">
            {t.text}
          </code>
        );
      case 'bold':
        return <strong key={key}>{renderInline(t.children ?? [], key)}</strong>;
      case 'italic':
        return <em key={key}>{renderInline(t.children ?? [], key)}</em>;
      case 'link': {
        const url = t.url ?? '';
        if (!isSafeUrl(url)) {
          return <span key={key}>{renderInline(t.children ?? [], key)}</span>;
        }
        return (
          <a
            key={key}
            href={url.trim()}
            target="_blank"
            rel="noopener noreferrer"
            className="md-link"
          >
            {renderInline(t.children ?? [], key)}
          </a>
        );
      }
      default:
        return null;
    }
  });
}

function renderBlock(block: Block, idx: number): ReactNode {
  const key = `b-${idx}`;
  switch (block.type) {
    case 'heading': {
      const inline = renderInline(parseInline(block.text), key);
      const cls = `md-h md-h${block.level}`;
      if (block.level === 1) return <h1 key={key} className={cls}>{inline}</h1>;
      if (block.level === 2) return <h2 key={key} className={cls}>{inline}</h2>;
      if (block.level === 3) return <h3 key={key} className={cls}>{inline}</h3>;
      if (block.level === 4) return <h4 key={key} className={cls}>{inline}</h4>;
      if (block.level === 5) return <h5 key={key} className={cls}>{inline}</h5>;
      return <h6 key={key} className={cls}>{inline}</h6>;
    }
    case 'paragraph':
      return (
        <p key={key} className="md-p">
          {renderInline(parseInline(block.text), key)}
        </p>
      );
    case 'code':
      return (
        <pre key={key} className="md-code-block">
          <code data-lang={block.lang || undefined}>{block.text}</code>
        </pre>
      );
    case 'quote':
      return (
        <blockquote key={key} className="md-quote">
          {renderInline(parseInline(block.lines.join('\n')), key)}
        </blockquote>
      );
    case 'ul':
      return (
        <ul key={key} className="md-list">
          {block.items.map((it, i) => (
            <li key={`${key}-${i}`}>
              {renderInline(parseInline(it), `${key}-${i}`)}
            </li>
          ))}
        </ul>
      );
    case 'ol':
      return (
        <ol key={key} className="md-list">
          {block.items.map((it, i) => (
            <li key={`${key}-${i}`}>
              {renderInline(parseInline(it), `${key}-${i}`)}
            </li>
          ))}
        </ol>
      );
    case 'hr':
      return <hr key={key} className="md-hr" />;
  }
}

export function renderMarkdown(src: string): ReactNode {
  const blocks = parseBlocks(src);
  return blocks.map((b, i) => renderBlock(b, i));
}
