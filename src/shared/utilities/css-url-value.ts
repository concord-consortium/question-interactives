export const cssUrlValue = (url: string) => {
  return `url("${url.replace(/"/g, "\\\"")}")`;
};
