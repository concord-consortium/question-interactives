// Parse author-provided "name=label" mappings. Newlines and `&` are both supported
// as separators; `=` splits name from label at the first occurrence. Matches the
// parsing approach in packages/full-screen/src/utils/url-prefix-params.ts — using
// URLSearchParams gives predictable behavior for mixed separators and lets authors
// URL-encode literal `&` or `=` if they ever need to.
export const parseColumnDisplayNames = (
  raw: string | undefined
): Record<string, string> => {
  const result: Record<string, string> = {};
  if (!raw) {
    return result;
  }
  const normalized = raw.replace(/\r?\n/g, "&");
  const params = new URLSearchParams(normalized);
  params.forEach((value, key) => {
    const trimmedKey = key.trim();
    const trimmedValue = value.trim();
    if (trimmedKey && trimmedValue) {
      result[trimmedKey] = trimmedValue;
    }
  });
  return result;
};
