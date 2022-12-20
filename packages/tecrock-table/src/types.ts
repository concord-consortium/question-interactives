import { IAuthoringMetadataBase, IDataset, IRuntimeInteractiveMetadata } from "@concord-consortium/lara-interactive-api";

export interface IAuthoredState extends IAuthoringMetadataBase {
  version: number;
  dataSourceInteractive?: string;
}

export interface ITectonicExplorerInteractiveState extends IRuntimeInteractiveMetadata {
  dataset: IDataset;
  snapshotRequestTimestamp?: number;
  planetViewSnapshot?: string;
  crossSectionSnapshot?: string;
}
