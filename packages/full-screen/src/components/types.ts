import { IRuntimeInteractiveMetadata } from "@concord-consortium/lara-interactive-api";

export interface IInteractiveState extends IRuntimeInteractiveMetadata {
  subinteractiveStates: {
    [id: string]: any;
  },
  currentSubinteractiveId: string;
  submitted: boolean;
}
