import { IAuthoringInteractiveMetadata, IRuntimeInteractiveMetadata } from "@concord-consortium/lara-interactive-api";

export const blankRegexp = /\[blank-\w+\]/g; // will match [blank-1], [blank-test], [blank-second_option] etc.
export const defaultBlankSize = 20; // characters

export interface IBlankDef {
  id: string;
  size: number;
  matchTerm?: string;
}

export interface IAuthoredState extends IAuthoringInteractiveMetadata {
  version: number;
  prompt?: string;
  hint?: string;
  blanks?: IBlankDef[];
  required?: boolean;
}

export interface IFilledBlank {
  id: string;
  response: string;
}

export interface IInteractiveState extends IRuntimeInteractiveMetadata {
  blanks: IFilledBlank[];
  submitted?: boolean;
}
