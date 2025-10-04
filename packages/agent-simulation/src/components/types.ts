import { IAuthoringInteractiveMetadata, IRuntimeInteractiveMetadata } from "@concord-consortium/lara-interactive-api";

import { predatorPreyCode } from "../sims/predator-prey-model";

// Note that TS interfaces should match JSON schema. Currently there's no way to generate one from the other.
// TS interfaces are not available in runtime in contrast to JSON schema.

export interface IAuthoredState extends IAuthoringInteractiveMetadata {
  code: string;
  dataSourceInteractive?: string;
  gridHeight: number;
  gridStep: number;
  gridWidth: number;
  hint?: string;
  version: number;
}

export interface IInteractiveState extends IRuntimeInteractiveMetadata {
  exampleInteractiveState?: string;
  submitted?: boolean;
}

export const DefaultAuthoredState: Omit<Required<IAuthoredState>, "questionSubType"|"required"|"prompt"> = {
  code: "",
  dataSourceInteractive: "",
  gridHeight: 450,
  gridStep: 450,
  gridWidth: 15,
  hint: "",
  questionType: "iframe_interactive",
  version: 1,
};

export const DemoAuthoredState: IAuthoredState = {
  code: predatorPreyCode,
  dataSourceInteractive: "",
  gridHeight: 450,
  gridStep: 450,
  gridWidth: 15,
  hint: "TODO: Add the final real hint in types.ts",
  prompt: "<p>TODO: Add the final real prompt in types.ts</p>",
  questionType: "iframe_interactive",
  version: 1,
};
