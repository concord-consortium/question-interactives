import { log } from "@concord-consortium/lara-interactive-api";

const kLabbookLogPrefix = "Labbook:";

export type LabbookLogType =
    "picture uploaded"
  | "snapshot uploaded"
  | "item added"
  | "item deleted"
  | "item selected"
  | "upload fail"

export interface ILogParams {
  action: LabbookLogType;
  data?: Record<string, unknown>;
}

export const Log = (params: ILogParams) => {
  log(`${kLabbookLogPrefix} ${params.action}`, params.data);
};
