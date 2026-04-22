import { useState, type ReactNode } from 'react';
import {
  chineseToUnicode,
  compressJson,
  escapeString,
  formatJson,
  unescapeString,
  unicodeToChinese,
} from '../utils/jsonUtils';

interface ToolbarProps {
  input: string;
  setInput: (v: string) => void;
  children?: ReactNode;
}

export function Toolbar({ input, setInput, children }: ToolbarProps) {
  const [indent, setIndent] = useState(2);
  const [err, setErr] = useState<string | null>(null);

  const run = (fn: () => string) => {
    try {
      const out = fn();
      setInput(out);
      setErr(null);
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    }
  };

  return (
    <div className="toolbar">
      <div className="toolbar-group">
        <button
          className="btn primary"
          onClick={() => run(() => formatJson(input, indent))}
          disabled={!input}
        >
          格式化
        </button>
        <select
          className="indent-select"
          value={indent}
          onChange={(e) => setIndent(Number(e.target.value))}
          title="缩进"
        >
          <option value={2}>2 空格</option>
          <option value={4}>4 空格</option>
        </select>
        <button
          className="btn"
          onClick={() => run(() => compressJson(input))}
          disabled={!input}
        >
          压缩
        </button>
      </div>

      <div className="toolbar-group">
        <button
          className="btn"
          onClick={() => setInput(unescapeString(input))}
          disabled={!input}
          title={'将转义后的字符串还原为原文（\\" → ", \\n → 换行等）'}
        >
          去转义
        </button>
        <button
          className="btn"
          onClick={() => setInput(escapeString(input))}
          disabled={!input}
          title={'将字符串中的特殊字符转义(" → \\", 换行 → \\n 等)'}
        >
          加转义
        </button>
      </div>

      <div className="toolbar-group">
        <button
          className="btn"
          onClick={() => setInput(unicodeToChinese(input))}
          disabled={!input}
          title={'将 \\uXXXX 转换为对应字符'}
        >
          Unicode → 中文
        </button>
        <button
          className="btn"
          onClick={() => setInput(chineseToUnicode(input))}
          disabled={!input}
          title={'将非 ASCII 字符转换为 \\uXXXX'}
        >
          中文 → Unicode
        </button>
      </div>

      <div className="toolbar-group">
        <button
          className="btn"
          onClick={() => navigator.clipboard.writeText(input)}
          disabled={!input}
        >
          复制
        </button>
        <button
          className="btn danger"
          onClick={() => {
            setInput('');
            setErr(null);
          }}
          disabled={!input}
        >
          清空
        </button>
        {children}
      </div>

      {err && <div className="toolbar-err">错误：{err}</div>}
    </div>
  );
}
