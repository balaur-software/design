import { describe, expect, it } from "bun:test";
import type { Agent } from "../../organisms/ChatPanel/chat-types";
import { agentAccent, agentMosaic } from "./AgentGlyph";

const agent = (id: string): Agent => ({ id, name: id });

describe("agentMosaic", () => {
  it("is deterministic for the same id", () => {
    const a = agentMosaic(agent("relay-07"));
    const b = agentMosaic(agent("relay-07"));
    expect(a).toBe(b);
  });

  it("differs for different ids", () => {
    expect(agentMosaic(agent("alpha"))).not.toBe(agentMosaic(agent("beta")));
  });

  it("is a 2-line string of 2 quadrant glyphs each", () => {
    const m = agentMosaic(agent("x"));
    const lines = m.split("\n");
    expect(lines.length).toBe(2);
    expect(lines[0]?.length).toBe(2);
    expect(lines[1]?.length).toBe(2);
  });
});

describe("agentAccent", () => {
  it("returns the agent accent override when set", () => {
    expect(agentAccent({ id: "x", name: "x", accent: "#ff0000" })).toBe("#ff0000");
  });

  it("returns a PALETTE hex when no override", () => {
    const c = agentAccent(agent("y"));
    expect(c.startsWith("#")).toBe(true);
    expect(c.length).toBe(7);
  });
});
