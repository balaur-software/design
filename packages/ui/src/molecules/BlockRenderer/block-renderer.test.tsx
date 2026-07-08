import { describe, expect, it } from "bun:test";
import { renderToString } from "react-dom/server";
import type { Block } from "../../organisms/ChatPanel/chat-types";
import { BlockRenderer } from "./BlockRenderer";

/**
 * Table-driven dispatch test: one fixture per `Block` variant, rendered
 * server-side (no DOM) and asserted against a marker unique to the molecule
 * that variant delegates to. Pins `BlockRenderer`'s switch to each branch so a
 * dispatch regression (wrong molecule, dropped prop) fails here.
 */
describe("BlockRenderer dispatch", () => {
  it("renders a text block via TextBlock", () => {
    const block: Block = { type: "text", text: "hello from text block" };
    const html = renderToString(<BlockRenderer block={block} />);
    expect(html).toContain("hello from text block");
  });

  it("renders a reasoning block via ReasoningBlock", () => {
    // ReasoningBlock collapses its body by default; BlockRenderer only forwards
    // `defaultCollapsed` when truthy, so `false` never reaches it here. Assert
    // on the always-rendered "THINKING" trigger, which survives collapse and is
    // unique to this branch.
    const block: Block = { type: "reasoning", text: "thinking about the answer" };
    const html = renderToString(<BlockRenderer block={block} />);
    expect(html).toContain("THINKING");
  });

  it("renders a tool_call block via ToolCallBlock", () => {
    const block: Block = {
      type: "tool_call",
      id: "call-1",
      name: "search_docs",
      status: "done",
    };
    const html = renderToString(<BlockRenderer block={block} />);
    expect(html).toContain("search_docs");
  });

  it("renders a code block via CodeBlock", () => {
    const block: Block = { type: "code", language: "ts", code: "const x = 42;" };
    const html = renderToString(<BlockRenderer block={block} />);
    expect(html).toContain("const x = 42;");
  });

  it("renders an artifact block via ArtifactPanel", () => {
    const block: Block = {
      type: "artifact",
      id: "artifact-1",
      title: "render.py",
      kind: "code",
      content: "print('hi')",
    };
    const html = renderToString(<BlockRenderer block={block} />);
    expect(html).toContain("render.py");
  });

  it("renders a citations block via CitationList/CitationSource", () => {
    const block: Block = {
      type: "citations",
      sources: [{ label: "1", children: "octant-design/README.md" }],
    };
    const html = renderToString(<BlockRenderer block={block} />);
    expect(html).toContain("octant-design/README.md");
  });

  it("falls back to a dim placeholder for an unknown block type", () => {
    const html = renderToString(<BlockRenderer block={{ type: "mystery" } as unknown as Block} />);
    // React SSR inserts a comment marker between adjacent text nodes, so the
    // literal string "unknown block: mystery" never appears verbatim; assert
    // both halves instead.
    expect(html).toContain("unknown block:");
    expect(html).toContain("mystery");
  });
});
