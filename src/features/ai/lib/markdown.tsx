import type { ReactNode } from "react";
import { Fragment } from "react";

/**
 * Minimal markdown renderer purpose-built for concierge replies: bold
 * text, links, and (un)ordered lists. Deliberately not a full CommonMark
 * implementation — the system prompt only needs to express structured,
 * editorial-style answers, and pulling in a markdown library would be an
 * unnecessary dependency for this scope.
 */
export function renderMarkdown(content: string): ReactNode {
  const lines = content.replace(/\r\n/g, "\n").split("\n");
  const blocks: ReactNode[] = [];

  let paragraphBuffer: string[] = [];
  let listBuffer: { ordered: boolean; items: string[] } | null = null;

  const flushParagraph = () => {
    if (paragraphBuffer.length === 0) return;
    const text = paragraphBuffer.join(" ").trim();
    if (text) {
      blocks.push(
        <p key={`p-${blocks.length}`} className="leading-relaxed">
          {renderInline(text)}
        </p>
      );
    }
    paragraphBuffer = [];
  };

  const flushList = () => {
    if (!listBuffer) return;
    const { ordered, items } = listBuffer;
    const ListTag = ordered ? "ol" : "ul";
    blocks.push(
      <ListTag
        key={`list-${blocks.length}`}
        className={`space-y-1.5 pl-5 ${ordered ? "list-decimal" : "list-disc"} marker:text-sky-500`}
      >
        {items.map((item, index) => (
          <li key={index} className="leading-relaxed">
            {renderInline(item)}
          </li>
        ))}
      </ListTag>
    );
    listBuffer = null;
  };

  for (const rawLine of lines) {
    const line = rawLine.trim();

    if (!line) {
      flushParagraph();
      flushList();
      continue;
    }

    const unorderedMatch = /^[-*•]\s+(.*)$/.exec(line);
    const orderedMatch = /^\d+[.)]\s+(.*)$/.exec(line);

    if (unorderedMatch || orderedMatch) {
      flushParagraph();
      const ordered = Boolean(orderedMatch);
      const text = (unorderedMatch ?? orderedMatch)![1];
      if (!listBuffer || listBuffer.ordered !== ordered) {
        flushList();
        listBuffer = { ordered, items: [] };
      }
      listBuffer.items.push(text);
      continue;
    }

    flushList();
    paragraphBuffer.push(line);
  }

  flushParagraph();
  flushList();

  return <>{blocks}</>;
}

/**
 * Restricts renderable link targets to safe schemes. AI-generated text is
 * untrusted input — without this, a `[text](javascript:...)`-style
 * response could render a clickable XSS vector.
 */
function isSafeUrl(url: string): boolean {
  if (url.startsWith("/") || url.startsWith("#")) return true;
  return /^(https?|mailto|tel):/i.test(url);
}

/** Handles **bold**, [text](url), and bare https:// URLs within a single line. */
function renderInline(text: string): ReactNode {
  const tokenPattern = /(\*\*[^*]+\*\*|\[[^\]]+\]\([^)]+\)|https?:\/\/[^\s)]+)/g;
  const parts = text.split(tokenPattern).filter((part) => part !== "");

  return parts.map((part, index) => {
    if (/^\*\*[^*]+\*\*$/.test(part)) {
      return (
        <strong key={index} className="font-semibold text-navy-900">
          {part.slice(2, -2)}
        </strong>
      );
    }

    const linkMatch = /^\[([^\]]+)\]\(([^)]+)\)$/.exec(part);
    if (linkMatch && isSafeUrl(linkMatch[2])) {
      return (
        <a
          key={index}
          href={linkMatch[2]}
          target={linkMatch[2].startsWith("/") ? undefined : "_blank"}
          rel={linkMatch[2].startsWith("/") ? undefined : "noreferrer noopener"}
          className="font-medium text-sky-600 underline decoration-sky-300 underline-offset-2 transition-colors hover:text-sky-700"
        >
          {linkMatch[1]}
        </a>
      );
    }
    if (linkMatch) {
      // Unsafe scheme (e.g. javascript:, data:) — render as plain text
      // rather than a clickable link.
      return <Fragment key={index}>{linkMatch[1]}</Fragment>;
    }

    if (/^https?:\/\//.test(part)) {
      return (
        <a
          key={index}
          href={part}
          target="_blank"
          rel="noreferrer noopener"
          className="font-medium text-sky-600 underline decoration-sky-300 underline-offset-2 transition-colors hover:text-sky-700"
        >
          {part}
        </a>
      );
    }

    return <Fragment key={index}>{part}</Fragment>;
  });
}
