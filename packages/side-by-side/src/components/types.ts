import { IAuthoringInteractiveMetadata, IRuntimeInteractiveMetadata } from "@concord-consortium/lara-interactive-api";

export interface IAuthoredState extends IAuthoringInteractiveMetadata {
  version: 1;
  prompt?: string;
  division: number;
  leftInteractive?: {
    id: string;
    libraryInteractiveId: string;
    authoredState: any;
    navImageUrl?: string;
    navImageAltText?: string;
  }
  rightInteractive?: {
    id: string;
    libraryInteractiveId: string;
    authoredState: any;
    navImageUrl?: string;
    navImageAltText?: string;
  }
}

export interface IInteractiveState extends IRuntimeInteractiveMetadata {
  leftInteractiveState: any;
  rightInteractiveState: any;
}
