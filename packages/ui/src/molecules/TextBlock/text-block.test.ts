import { describe, expect, it } from "bun:test";
import { tokenizeInline } from "./TextBlock";

describe("tokenizeInline", () => {
  it("returns a single plain token for plain text", () => {
    expect(tokenizeInline("hello world")).toEqual([{ kind: "text", text: "hello world" }]);
  });

  it("extracts backtick code spans", () => {
    expect(tokenizeInline("use `bar8` here")).toEqual([
      { kind: "text", text: "use " },
      { kind: "code", text: "bar8" },
      { kind: "text", text: " here" },
    ]);
  });

  it("extracts **bold** spans", () => {
    expect(tokenizeInline("a **bold** word")).toEqual([
      { kind: "text", text: "a " },
      { kind: "bold", text: "bold" },
      { kind: "text", text: " word" },
    ]);
  });

  it("extracts bare http(s) URLs as links", () => {
    expect(tokenizeInline("see https://x.io/y for details")).toEqual([
      { kind: "text", text: "see " },
      { kind: "link", text: "https://x.io/y", href: "https://x.io/y" },
      { kind: "text", text: " for details" },
    ]);
  });

  it("handles mixed code and bold", () => {
    expect(tokenizeInline("`a` and **b**")).toEqual([
      { kind: "code", text: "a" },
      { kind: "text", text: " and " },
      { kind: "bold", text: "b" },
    ]);
  });

  it("ignores unmatched markers", () => {
    expect(tokenizeInline("a ` b")).toEqual([{ kind: "text", text: "a ` b" }]);
  });
});
