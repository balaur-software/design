/**
 * Detect a leading slash-command token at the caret.
 *
 * Looks at the substring from the start of the caret's current line to the
 * caret. When that substring matches `/^\/(\S*)$/` (a leading slash, optionally
 * followed by non-whitespace, nothing else before the caret) the query after
 * the `/` is returned — the same "leading token" rule Slack/Discord/Linear use,
 * not a slash appearing mid-sentence. Returns `null` when a space follows the
 * token or the caret is off the token's line.
 */
export function getLeadingSlashQuery(text: string, caretIndex: number): string | null {
  const lineStart = text.lastIndexOf("\n", caretIndex - 1) + 1;
  const beforeCaret = text.slice(lineStart, caretIndex);
  const match = /^\/(\S*)$/.exec(beforeCaret);
  return match ? (match[1] ?? "") : null;
}
