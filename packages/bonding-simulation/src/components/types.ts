import { IAuthoringInteractiveMetadata, IRuntimeInteractiveMetadata } from "@concord-consortium/lara-interactive-api";

export interface IAuthoredState extends IAuthoringInteractiveMetadata {
  version: 1;
  chamberWidth: number;
  chamberHeight: number;
  gridStep: number;
  initialH: number;
  initialO: number;
  initialCl: number;
  initialCH4: number;
  initialTemperature: number;
  hint?: string;
}

export interface IInteractiveState extends IRuntimeInteractiveMetadata {
  version: 1;
  simSpeed?: number;
  submitted?: boolean;
}

export const DefaultAuthoredState: Omit<Required<IAuthoredState>,
  "questionSubType"|"required"|"prompt"> = {
  version: 1,
  chamberWidth: 300,
  chamberHeight: 300,
  gridStep: 10,
  initialH: 15,
  initialO: 8,
  initialCl: 4,
  initialCH4: 3,
  initialTemperature: 25,
  hint: "",
  questionType: "iframe_interactive",
};

export const DemoAuthoredState: IAuthoredState = {
  version: 1,
  chamberWidth: 300,
  chamberHeight: 300,
  gridStep: 10,
  initialH: 15,
  initialO: 8,
  initialCl: 4,
  initialCH4: 3,
  initialTemperature: 25,
  hint: "",
  prompt: "Explore how atoms bond in a closed chamber. Adjust element counts and temperature.",
  questionType: "iframe_interactive",
};
