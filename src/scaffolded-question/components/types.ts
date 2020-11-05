import { IAuthoringInteractiveMetadata, IRuntimeInteractiveMetadata } from "@concord-consortium/lara-interactive-api";

// Note that TS interfaces should match JSON schema. Currently there's no way to generate one from the other.
// TS interfaces are not available in runtime in contrast to JSON schema.
export interface IAuthoredState extends IAuthoringInteractiveMetadata {
  version: 2;
  hint?: string;
  subinteractives?: {
    id: string;
    libraryInteractiveId: string;
    authoredState: any;
  }[]
}

export interface IInteractiveState extends IRuntimeInteractiveMetadata {
  subinteractiveStates: {
    [id: string]: any;
  },
  currentSubinteractiveId: string;
  submitted: boolean;
}

// Old authored state versions:
export interface IAuthoredStateV1 extends IAuthoringInteractiveMetadata {
  version: 1;
  hint?: string;
  subinteractives?: {
    id: string;
    url: string;
    authoredState: any;
  }[]
}
