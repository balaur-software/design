import { describe, expect, it } from "bun:test";
import { getLeadingSlashQuery } from "./slash-query";

describe("getLeadingSlashQuery", () => {
  it("detects a bare leading slash at line start (empty query)", () => {
    expect(getLeadingSlashQuery("/", 1)).toBe("");
  });

  it("detects a partial token after the slash", () => {
    expect(getLeadingSlashQuery("/qu", 3)).toBe("qu");
  });

  it("returns the query up to the caret when the caret sits mid-token", () => {
    expect(getLeadingSlashQuery("/deploy", 4)).toBe("dep");
  });

  it("returns null for a slash mid-sentence", () => {
    expect(getLeadingSlashQuery("hey /", 5)).toBeNull();
  });

  it("returns null when a space follows the token before the caret", () => {
    expect(getLeadingSlashQuery("/deploy ", 8)).toBeNull();
  });

  it("returns null when the caret is on a different line than the slash", () => {
    expect(getLeadingSlashQuery("/dep\nhello", 10)).toBeNull();
  });

  it("detects a slash on the second line of multiline text", () => {
    expect(getLeadingSlashQuery("hello\n/su", 9)).toBe("su");
  });

  it("returns null for the empty string", () => {
    expect(getLeadingSlashQuery("", 0)).toBeNull();
  });

  it("returns null with the caret at 0, before a slash", () => {
    expect(getLeadingSlashQuery("/cmd", 0)).toBeNull();
  });

  it("returns null when the caret sits right after a newline", () => {
    expect(getLeadingSlashQuery("ab\n/x", 3)).toBeNull();
  });
});
