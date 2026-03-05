import { IAuthoringInteractiveMetadata, IRuntimeInteractiveMetadata } from "@concord-consortium/lara-interactive-api";

// Note that TS interfaces should match JSON schema. Currently there's no way to generate one from the other.
// TS interfaces are not available in runtime in contrast to JSON schema.

export interface IAuthoredState extends IAuthoringInteractiveMetadata {
  version: number;
  buttonLabel?: string;
  scriptUrl?: string;
}

export interface IInteractiveState extends IRuntimeInteractiveMetadata {
  submitted?: boolean;
}

export interface IScriptResponse {
  status: "queued" | "success" | "failure";
  message: string;
  disableButton: boolean;
  processingMessage?: string;
}

export interface IFakeScriptResult {
  queued: IScriptResponse;
  result: Promise<IScriptResponse>;
}

export const DefaultAuthoredState: Omit<Required<IAuthoredState>, "questionSubType"|"required"|"prompt"> = {
  version: 1,
  questionType: "iframe_interactive",
  buttonLabel: "",
  scriptUrl: "",
};

export const DemoAuthoredState: IAuthoredState = {
  version: 1,
  questionType: "iframe_interactive",
  prompt: "<p>Click this button when you have finished answering all the questions.</p>",
  buttonLabel: "I'm Done!",
  scriptUrl: "https://example.com/success",
};
