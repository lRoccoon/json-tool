import { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import type { Components, Options } from 'react-markdown';
import remarkGfm from 'remark-gfm';

// react-markdown 默认不渲染原始 HTML，且默认 urlTransform 会过滤
// javascript: 等危险协议，因此无需自行做 URL 白名单。
const components: Components = {
  a({ node: _node, href, children, ...rest }) {
    return (
      <a {...rest} href={href} target="_blank" rel="noopener noreferrer">
        {children}
      </a>
    );
  },
};

type RehypePlugins = NonNullable<Options['rehypePlugins']>;

// 检测围栏代码块（``` 或 ~~~），缩进式代码块不在此列。
function hasCodeBlock(text: string): boolean {
  return /(^|\n) {0,3}(```|~~~)/.test(text);
}

export function MarkdownView({ text }: { text: string }) {
  // rehype-highlight + highlight.js 体积较大，默认不加载；
  // 仅当文本中出现代码块时才动态 import，单独成 chunk 懒加载。
  const [rehypePlugins, setRehypePlugins] = useState<RehypePlugins>([]);

  useEffect(() => {
    if (!hasCodeBlock(text)) {
      setRehypePlugins([]);
      return;
    }
    let cancelled = false;
    import('rehype-highlight').then((m) => {
      if (!cancelled) setRehypePlugins([m.default]);
    });
    return () => {
      cancelled = true;
    };
  }, [text]);

  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      rehypePlugins={rehypePlugins}
      components={components}
    >
      {text}
    </ReactMarkdown>
  );
}
