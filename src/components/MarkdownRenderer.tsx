"use client";

import React from "react";

interface MarkdownRendererProps {
  content: string;
  onToggleTask?: (lineIndex: number) => void;
  className?: string;
}

function sanitizeHref(href: string): string | null {
  if (!href) return null;
  const trimmed = href.trim().toLowerCase();
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return href.trim();
  }
  return null;
}

function parseInline(text: string, keyPrefix = "inline"): React.ReactNode[] {
  const nodes: React.ReactNode[] = [];
  let current = text;
  let keyIndex = 0;

  while (current.length > 0) {
    // Bold & Italic ***text***
    const boldItalicMatch = current.match(/^(\*\*\*|___)(.*?)\1/);
    if (boldItalicMatch) {
      nodes.push(
        <strong key={`${keyPrefix}-${keyIndex++}`}>
          <em>{boldItalicMatch[2]}</em>
        </strong>
      );
      current = current.slice(boldItalicMatch[0].length);
      continue;
    }

    // Bold **text** or __text__
    const boldMatch = current.match(/^(\*\*|__)(.*?)\1/);
    if (boldMatch) {
      nodes.push(
        <strong key={`${keyPrefix}-${keyIndex++}`} className="font-semibold text-slate-100 light:text-slate-900">
          {boldMatch[2]}
        </strong>
      );
      current = current.slice(boldMatch[0].length);
      continue;
    }

    // Italic *text* or _text_
    const italicMatch = current.match(/^(\*|_)(.*?)\1/);
    if (italicMatch) {
      nodes.push(
        <em key={`${keyPrefix}-${keyIndex++}`} className="italic">
          {italicMatch[2]}
        </em>
      );
      current = current.slice(italicMatch[0].length);
      continue;
    }

    // Inline Code `code`
    const codeMatch = current.match(/^`([^`]+)`/);
    if (codeMatch) {
      nodes.push(
        <code
          key={`${keyPrefix}-${keyIndex++}`}
          className="px-1.5 py-0.5 rounded-md bg-slate-800 light:bg-slate-200 font-mono text-xs text-indigo-300 light:text-indigo-700 border border-slate-700/50 light:border-slate-300/60"
        >
          {codeMatch[1]}
        </code>
      );
      current = current.slice(codeMatch[0].length);
      continue;
    }

    // Link [text](url)
    const linkMatch = current.match(/^\[([^\]]+)\]\(([^)]+)\)/);
    if (linkMatch) {
      const linkText = linkMatch[1];
      const linkUrl = linkMatch[2];
      const safeUrl = sanitizeHref(linkUrl);

      if (safeUrl) {
        nodes.push(
          <a
            key={`${keyPrefix}-${keyIndex++}`}
            href={safeUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-indigo-400 light:text-indigo-600 hover:underline font-medium"
          >
            {linkText}
          </a>
        );
      } else {
        // Unsafe protocol -> render as safe text
        nodes.push(
          <span key={`${keyPrefix}-${keyIndex++}`} className="text-slate-400 line-through">
            {linkText} ({linkUrl})
          </span>
        );
      }
      current = current.slice(linkMatch[0].length);
      continue;
    }

    // Default plain character
    nodes.push(current[0]);
    current = current.slice(1);
  }

  return nodes;
}

export function MarkdownRenderer({
  content,
  onToggleTask,
  className = "",
}: MarkdownRendererProps) {
  if (!content) {
    return <div className="text-slate-500 italic text-sm">Empty note</div>;
  }

  const lines = content.split("\n");
  const elements: React.ReactNode[] = [];
  let inCodeBlock = false;
  let codeBlockLines: string[] = [];
  let codeBlockKey = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Code Block ```
    if (line.trim().startsWith("```")) {
      if (inCodeBlock) {
        // End code block
        elements.push(
          <pre
            key={`codeblock-${codeBlockKey++}`}
            className="p-4 my-3 rounded-2xl bg-slate-950 light:bg-slate-900 text-slate-200 font-mono text-xs overflow-x-auto border border-slate-800"
          >
            <code>{codeBlockLines.join("\n")}</code>
          </pre>
        );
        codeBlockLines = [];
        inCodeBlock = false;
      } else {
        inCodeBlock = true;
      }
      continue;
    }

    if (inCodeBlock) {
      codeBlockLines.push(line);
      continue;
    }

    // Headings # ## ###
    const headingMatch = line.match(/^(#{1,6})\s+(.*)$/);
    if (headingMatch) {
      const level = headingMatch[1].length;
      const text = headingMatch[2];
      const parsed = parseInline(text, `h-${i}`);

      if (level === 1) {
        elements.push(
          <h1 key={`line-${i}`} className="text-2xl font-bold text-slate-100 light:text-slate-900 mt-6 mb-3 border-b border-slate-800 pb-2">
            {parsed}
          </h1>
        );
      } else if (level === 2) {
        elements.push(
          <h2 key={`line-${i}`} className="text-xl font-semibold text-slate-100 light:text-slate-900 mt-5 mb-2">
            {parsed}
          </h2>
        );
      } else {
        elements.push(
          <h3 key={`line-${i}`} className="text-lg font-medium text-slate-200 light:text-slate-800 mt-4 mb-2">
            {parsed}
          </h3>
        );
      }
      continue;
    }

    // Checkbox Task List `- [ ]` or `- [x]`
    const taskMatch = line.match(/^(\s*)[-*+]\s+\[([ xX])\]\s+(.*)$/);
    if (taskMatch) {
      const isChecked = taskMatch[2].toLowerCase() === "x";
      const taskText = taskMatch[3];
      const lineIndex = i;

      elements.push(
        <div key={`line-${i}`} className="flex items-start gap-2.5 my-1.5 pl-1">
          <input
            type="checkbox"
            checked={isChecked}
            onChange={() => onToggleTask && onToggleTask(lineIndex)}
            className="w-4 h-4 mt-1 rounded text-indigo-500 focus:ring-indigo-500 border-slate-700 cursor-pointer"
          />
          <span
            className={`text-sm leading-relaxed ${
              isChecked
                ? "line-through text-slate-500 dark:text-slate-500 light:text-slate-400"
                : "text-slate-200 light:text-slate-800"
            }`}
          >
            {parseInline(taskText, `task-${i}`)}
          </span>
        </div>
      );
      continue;
    }

    // Bullet List `- item` or `* item`
    const bulletMatch = line.match(/^(\s*)[-*+]\s+(.*)$/);
    if (bulletMatch) {
      elements.push(
        <li key={`line-${i}`} className="ml-5 list-disc text-sm text-slate-200 light:text-slate-800 my-1">
          {parseInline(bulletMatch[2], `bullet-${i}`)}
        </li>
      );
      continue;
    }

    // Numbered List `1. item`
    const numMatch = line.match(/^(\s*)\d+\.\s+(.*)$/);
    if (numMatch) {
      elements.push(
        <li key={`line-${i}`} className="ml-5 list-decimal text-sm text-slate-200 light:text-slate-800 my-1">
          {parseInline(numMatch[2], `num-${i}`)}
        </li>
      );
      continue;
    }

    // Blockquote `> quote`
    const quoteMatch = line.match(/^>\s+(.*)$/);
    if (quoteMatch) {
      elements.push(
        <blockquote
          key={`line-${i}`}
          className="pl-4 my-2 border-l-4 border-indigo-500 text-slate-400 light:text-slate-600 italic text-sm"
        >
          {parseInline(quoteMatch[1], `quote-${i}`)}
        </blockquote>
      );
      continue;
    }

    // Horizontal Rule `---` or `***`
    if (line.trim() === "---" || line.trim() === "***") {
      elements.push(<hr key={`line-${i}`} className="my-6 border-slate-800 light:border-slate-200" />);
      continue;
    }

    // Empty line
    if (line.trim() === "") {
      elements.push(<div key={`line-${i}`} className="h-2" />);
      continue;
    }

    // Paragraph
    elements.push(
      <p key={`line-${i}`} className="text-sm text-slate-200 light:text-slate-800 leading-relaxed my-1.5">
        {parseInline(line, `p-${i}`)}
      </p>
    );
  }

  return <div className={`space-y-1 font-sans ${className}`}>{elements}</div>;
}