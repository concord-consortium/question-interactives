// Parse author-provided allow/ignore list text. Commas and newlines are treated as
// separators; spaces are preserved within names. Empty tokens are dropped. Used for
// both allow and ignore filter modes.
export const parseColumnFilter = (raw: string | undefined): string[] => {
  if (!raw) {
    return [];
  }
  return raw
    .split(/[,\r\n]+/)
    .map(s => s.trim())
    .filter(Boolean);
};
