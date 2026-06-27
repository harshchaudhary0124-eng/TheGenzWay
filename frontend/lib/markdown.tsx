import type { ReactNode } from "react";
import { C } from "@/lib/constants";

/**
 * Markdown-lite renderer. Supports **bold**, *italic*, `code`, `> blockquote`
 * lines, and auto-linked URLs. Renders React nodes directly (never raw HTML),
 * so user content can't inject markup — XSS-safe by construction.
 */

// Order matters: bold (**) is listed before italic (*) so `**x**` is matched
// as bold, not as two italic markers.
const INLINE = /(`[^`]+`)|(\*\*[^*]+\*\*)|(\*[^*]+\*)|(https?:\/\/[^\s]+)/g;

function parseInline(text: string, keyBase: string): ReactNode[] {
  const out: ReactNode[] = [];
  let last = 0;
  let match: RegExpExecArray | null;
  let i = 0;
  INLINE.lastIndex = 0;

  while ((match = INLINE.exec(text)) !== null) {
    if (match.index > last) out.push(text.slice(last, match.index));
    const [, code, bold, italic, url] = match;
    const key = `${keyBase}-${i++}`;

    if (code) {
      out.push(
        <code
          key={key}
          style={{
            fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
            fontSize: "0.86em",
            background: "rgba(255,255,255,0.07)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 4,
            padding: "1px 5px",
          }}
        >
          {code.slice(1, -1)}
        </code>,
      );
    } else if (bold) {
      out.push(
        <strong key={key} style={{ fontWeight: 700, color: C.cream }}>
          {bold.slice(2, -2)}
        </strong>,
      );
    } else if (italic) {
      out.push(
        <em key={key} style={{ fontStyle: "italic" }}>
          {italic.slice(1, -1)}
        </em>,
      );
    } else if (url) {
      out.push(
        <a
          key={key}
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: C.orange, textDecoration: "underline" }}
        >
          {url}
        </a>,
      );
    }
    last = match.index + match[0].length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

export function renderMarkdown(text: string): ReactNode {
  const lines = text.split("\n");
  return lines.map((line, idx) => {
    const isQuote = line.startsWith("> ") || line === ">";
    const content = isQuote ? line.replace(/^>\s?/, "") : line;
    const inline = parseInline(content, `l${idx}`);

    if (isQuote) {
      return (
        <span
          key={idx}
          style={{
            display: "block",
            borderLeft: `2px solid ${C.orange}`,
            paddingLeft: 10,
            color: C.muted,
            margin: "2px 0",
          }}
        >
          {inline.length ? inline : " "}
        </span>
      );
    }
    return (
      <span key={idx} style={{ display: "block" }}>
        {inline.length ? inline : " "}
      </span>
    );
  });
}
