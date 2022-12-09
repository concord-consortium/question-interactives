import { IAuthoringMetadataBase } from "@concord-consortium/lara-interactive-api";

export interface IAuthoredState extends IAuthoringMetadataBase {
  version: number;
  dataSourceInteractive?: string;
}
