import { IAuthoringInteractiveMetadata, IRuntimeInteractiveMetadata } from "@concord-consortium/lara-interactive-api";

// Note that TS interfaces should match JSON schema. Currently there's no way to generate one from the other.
// TS interfaces are not available in runtime in contrast to JSON schema.

export interface IAuthoredState extends IAuthoringInteractiveMetadata {
  version: number;
  hint?: string;
  dataSourceInteractive?: string;
}

export interface IInteractiveState extends IRuntimeInteractiveMetadata {
  submitted?: boolean;
  exampleInteractiveState?: string;
}

export const DefaultAuthoredState: Omit<Required<IAuthoredState>, "questionSubType"|"required"|"prompt"> = {
  version: 1,
  questionType: "iframe_interactive",
  hint: "",
  dataSourceInteractive: "",
};

export const DemoAuthoredState: IAuthoredState = {
  version: 1,
  questionType: "iframe_interactive",
  prompt: "<p>TODO: Add the final real prompt in types.ts</p>",
  hint: "TODO: Add the final real hint in types.ts",
  dataSourceInteractive: "",
};
