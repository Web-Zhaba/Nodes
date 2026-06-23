import React from "react";
import { cn } from "@/lib/utils";

interface MarkdownRendererProps {
  content: string;
  onWikiLinkClick?: (target: string) => void;
  existingTargets?: string[];
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content, onWikiLinkClick, existingTargets }) => {
  if (!content || content.trim() === "") {
    return (
      <p className="text-muted-foreground/50 italic font-sans text-sm py-4">
        Заметка пуста. Переключите режим сверху, чтобы отредактировать.
      </p>
    );
  }

  const lines = content.split("\n");
  const elements: React.ReactNode[] = [];
  let currentList: React.ReactNode[] = [];
  let listKey = 0;

  const parseInline = (text: string): React.ReactNode[] => {
    const tokens: React.ReactNode[] = [];
    let remaining = text;
    let key = 0;

    const wikiRegex = /^\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/;
    const linkRegex = /^\[([^\]]+)\]\(([^)]+)\)/;
    const boldRegex = /^\*\*([^*]+)\*\*/;
    const italicRegex = /^\*([^*]+)\*/;
    const codeRegex = /^`([^`]+)`/;

    while (remaining.length > 0) {
      if (remaining.startsWith("[[")) {
        const match = remaining.match(wikiRegex);
        if (match) {
          const target = match[1].trim();
          const label = (match[2] || match[1]).trim();
          const exists = existingTargets 
            ? existingTargets.some(t => t.toLowerCase() === target.toLowerCase()) 
            : true;

          tokens.push(
            <button
              key={key++}
              type="button"
              onClick={() => onWikiLinkClick?.(target)}
              className={cn(
                "font-semibold text-left cursor-pointer inline-block transition-all",
                exists
                  ? "text-primary hover:underline hover:-translate-y-0.5"
                  : "text-muted-foreground/50 hover:text-foreground/80 border-b border-dashed border-muted-foreground/30"
              )}
            >
              {label}
            </button>
          );
          remaining = remaining.substring(match[0].length);
          continue;
        }
      }
      if (remaining.startsWith("**")) {
        const match = remaining.match(boldRegex);
        if (match) {
          tokens.push(<strong key={key++} className="font-bold text-foreground">{match[1]}</strong>);
          remaining = remaining.substring(match[0].length);
          continue;
        }
      }
      if (remaining.startsWith("*")) {
        const match = remaining.match(italicRegex);
        if (match) {
          tokens.push(<em key={key++} className="italic text-muted-foreground/90">{match[1]}</em>);
          remaining = remaining.substring(match[0].length);
          continue;
        }
      }
      if (remaining.startsWith("`")) {
        const match = remaining.match(codeRegex);
        if (match) {
          tokens.push(
            <code key={key++} className="px-1.5 py-0.5 rounded bg-muted/80 font-mono text-xs text-primary border border-border/20">
              {match[1]}
            </code>
          );
          remaining = remaining.substring(match[0].length);
          continue;
        }
      }
      if (remaining.startsWith("[")) {
        const match = remaining.match(linkRegex);
        if (match) {
          tokens.push(
            <a
              key={key++}
              href={match[2]}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline font-semibold"
            >
              {match[1]}
            </a>
          );
          remaining = remaining.substring(match[0].length);
          continue;
        }
      }

      const nextSpecial = remaining.search(/[\*_`\[]/);
      if (nextSpecial === -1) {
        tokens.push(remaining);
        break;
      } else if (nextSpecial === 0) {
        tokens.push(remaining[0]);
        remaining = remaining.substring(1);
      } else {
        tokens.push(remaining.substring(0, nextSpecial));
        remaining = remaining.substring(nextSpecial);
      }
    }

    return tokens;
  };

  const flushList = () => {
    if (currentList.length > 0) {
      elements.push(
        <ul key={`list-${listKey++}`} className="list-disc pl-6 space-y-1.5 my-3 font-sans text-sm text-foreground/90">
          {currentList}
        </ul>
      );
      currentList = [];
    }
  };

  let elementKey = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    if (trimmed.startsWith("### ")) {
      flushList();
      elements.push(
        <h4 key={elementKey++} className="text-md font-bold tracking-tight mt-4 mb-2 text-foreground/95">
          {parseInline(trimmed.substring(4))}
        </h4>
      );
      continue;
    }
    if (trimmed.startsWith("## ")) {
      flushList();
      elements.push(
        <h3 key={elementKey++} className="text-lg font-bold tracking-tight mt-5 mb-2 text-foreground">
          {parseInline(trimmed.substring(3))}
        </h3>
      );
      continue;
    }
    if (trimmed.startsWith("# ")) {
      flushList();
      elements.push(
        <h2 key={elementKey++} className="text-xl font-extrabold tracking-tight mt-6 mb-3 text-primary border-b border-border/20 pb-1">
          {parseInline(trimmed.substring(2))}
        </h2>
      );
      continue;
    }

    if (trimmed.startsWith("- [ ] ") || trimmed.startsWith("- [x] ") || trimmed.startsWith("- [X] ")) {
      const checked = trimmed.startsWith("- [x] ") || trimmed.startsWith("- [X] ");
      const contentText = trimmed.substring(6);
      currentList.push(
        <li key={`li-${elementKey++}`} className="list-none flex items-start gap-2.5 my-1">
          <input
            type="checkbox"
            checked={checked}
            readOnly
            className="w-4 h-4 mt-0.5 rounded border-primary/30 text-primary bg-background/50 accent-primary focus:ring-0 shrink-0 pointer-events-none"
          />
          <span className={checked ? "line-through text-muted-foreground/60" : "text-foreground/90"}>
            {parseInline(contentText)}
          </span>
        </li>
      );
      continue;
    }

    if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
      const contentText = trimmed.substring(2);
      currentList.push(
        <li key={`li-${elementKey++}`} className="my-1">
          {parseInline(contentText)}
        </li>
      );
      continue;
    }

    if (trimmed === "") {
      flushList();
      elements.push(<div key={elementKey++} className="h-2" />);
      continue;
    }

    flushList();
    elements.push(
      <p key={elementKey++} className="my-2 leading-relaxed text-sm font-sans text-foreground/80">
        {parseInline(line)}
      </p>
    );
  }

  flushList();

  return <div className="space-y-1 break-words">{elements}</div>;
};
