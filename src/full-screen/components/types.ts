import { IAuthoringInteractiveMetadata, IRuntimeInteractiveMetadata } from "@concord-consortium/lara-interactive-api";

// Note that TS interfaces should match JSON schema. Currently there's no way to generate one from the other.
// TS interfaces are not available in runtime in contrast to JSON schema.
export interface IAuthoredState extends IAuthoringInteractiveMetadata {
  version: 2;
  subinteractive: {
    id: string;
    subInteractiveUrl: string;
    authoredState: any;
  }
}

export interface IInteractiveState extends IRuntimeInteractiveMetadata {
  id: string,
  subinteractiveState: any,
  submitted?: boolean;
}

export interface IAuthoredStateV1 extends IAuthoringInteractiveMetadata {
  version: 1;
  subinteractive?: {
    id: string;
    subInteractiveUrl: string;
    authoredState: any;
  }
}
