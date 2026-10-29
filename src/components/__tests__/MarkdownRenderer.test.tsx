import { describe, it, expect } from "vitest";
import React from "react";
import { render } from "@testing-library/react";
import { MarkdownRenderer } from "../MarkdownRenderer";

describe("MarkdownRenderer XSS Security & Parsing", () => {
  it("renders safe headings, bold, italic, and list items", () => {
    const { container: c1 } = render(<MarkdownRenderer content="# Heading 1" />);
    expect(c1.querySelector("h1")?.textContent?.trim()).toBe("Heading 1");

    const { container: c2 } = render(<MarkdownRenderer content="**Bold Text**" />);
    expect(c2.querySelector("strong")?.textContent?.trim()).toBe("Bold Text");

    const { container: c3 } = render(<MarkdownRenderer content="*Italic Text*" />);
    expect(c3.querySelector("em")?.textContent?.trim()).toBe("Italic Text");

    const { container: c4 } = render(<MarkdownRenderer content="- [ ] Task Item" />);
    expect(c4.querySelector("input[type='checkbox']")).not.toBeNull();
  });

  it("blocks javascript: URLs in markdown links", () => {
    const { container } = render(
      <MarkdownRenderer content="[Click Me](javascript:alert(1))" />
    );
    expect(container.querySelector("a")).toBeNull();
    expect(container.textContent).toContain("Click Me (javascript:alert(1))");
  });

  it("blocks data: URLs in markdown links", () => {
    const { container } = render(
      <MarkdownRenderer content="[Data Link](data:text/html,<script>alert(1)</script>)" />
    );
    expect(container.querySelector("a")).toBeNull();
  });

  it("allows safe http and https URLs", () => {
    const { container } = render(
      <MarkdownRenderer content="[Google](https://google.com) and [HTTP](http://example.com)" />
    );
    const links = container.querySelectorAll("a");
    expect(links.length).toBe(2);
    expect(links[0].getAttribute("href")).toBe("https://google.com");
    expect(links[0].getAttribute("target")).toBe("_blank");
    expect(links[0].getAttribute("rel")).toBe("noopener noreferrer");
  });

  it("safely escapes HTML tags in content", () => {
    const { container } = render(
      <MarkdownRenderer content="<script>alert('XSS')</script> <img src=x onerror=alert(1)>" />
    );
    expect(container.querySelector("script")).toBeNull();
    expect(container.querySelector("img")).toBeNull();
    expect(container.textContent).toContain("<script>alert('XSS')</script>");
  });
});