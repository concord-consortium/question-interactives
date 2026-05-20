import { IAuthoredState } from "./types";

export const preprocessFormData = (data: IAuthoredState): IAuthoredState => {
  // `?? "none"` treats an absent sampleIntervalUnit the same as "none" — a defensive
  // guard. RJSF's default populateAllDefaults behavior writes the dropdown's "none"
  // default into formData, so the unit is normally set explicitly.
  if ((data.sampleIntervalUnit ?? "none") === "none" && data.sampleInterval !== undefined) {
    const { sampleInterval, ...rest } = data;
    return rest;
  }
  return data;
};
