import { IAuthoringInteractiveMetadata, IRuntimeInteractiveMetadata } from "@concord-consortium/lara-interactive-api";

// Note that TS interfaces should match JSON schema. Currently there's no way to generate one from the other.
// TS interfaces are not available in runtime in contrast to JSON schema.

export interface IAuthoredState extends IAuthoringInteractiveMetadata {
  hint?: string;
  version: number;
  toolbox: string;
}

export interface IInteractiveState extends IRuntimeInteractiveMetadata {
  json?: string;
  submitted?: boolean;
}

export const DefaultAuthoredState: Omit<Required<IAuthoredState>, "questionSubType"|"required"|"prompt"> = {
  hint: "",
  questionType: "iframe_interactive",
  toolbox: "",
  version: 1
};

export const DemoAuthoredState: IAuthoredState = {
  hint: "TODO: Add the final real hint here later",
  prompt: "<p>TODO: Add the final real prompt here later</p>",
  questionType: "iframe_interactive",
  toolbox: "",
  version: 1
};
