import { IAuthoringConfig } from "../components/types";
import { codapAuthoringConfig } from "./codap-config";
import { genericAuthoringConfig } from "./generic-config";

// Registry of authoring configurations keyed by type name.
// app.tsx normalizes the authoring param (trim + lowercase) before lookup.
// Unknown types (including "true", "1", etc.) trigger a console warning
// and fall back to the generic config via getAuthoringConfig() returning null.
export const authoringConfigs: { [key: string]: IAuthoringConfig } = {
  codap: codapAuthoringConfig,
  generic: genericAuthoringConfig,
  // Future configs can be added here:
  // sage: sageAuthoringConfig,
  // netlogo: netlogoAuthoringConfig,
};

export const getAuthoringConfig = (type: string): IAuthoringConfig | null => {
  return authoringConfigs[type] || null;
};
