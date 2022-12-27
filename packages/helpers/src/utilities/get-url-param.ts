export const getURLParam = (name: string) => {
  const url = (self || window).location.href;
  name = name.replace(/[[]]/g, "\\$&");
  const regex = new RegExp(`[#?&]${name}(=([^&#]*)|&|#|$)`);
  const results = regex.exec(url);
  if (!results) return null;
  if (!results[2]) return true;
  return decodeURIComponent(results[2].replace(/\+/g, " "));
};
