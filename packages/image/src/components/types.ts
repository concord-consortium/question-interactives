// Note that TS interfaces should match JSON schema. Currently there's no way to generate one from the other.
// TS interfaces are not available in runtime in contrast to JSON schema.

export interface IAuthoredState {
  version: number;
  url?: string;
  highResUrl?: string;
  altText?: string;
  caption?: string;
  credit?: string;
  creditLink?: string;
  creditLinkDisplayText?: string;
  scaling?: "fitWidth" | "originalDimensions";
}
