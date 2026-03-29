export const slugify = (text: string, fallback = "demo"): string => {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || fallback;
};
