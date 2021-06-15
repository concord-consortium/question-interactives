import { IAuthoringInteractiveMetadata, IRuntimeInteractiveMetadata } from "@concord-consortium/lara-interactive-api";

export type ItemId = string;

export interface IDraggableItem {
  id: ItemId;
  label: string;
  value: number;
  targetMatch: number;
  imageUrl?: string;
}

export interface IPosition {
  left: number;
  top: number;
}

export interface IInitialState {
  itemPositions?: Record<ItemId, IPosition>;
  targetPositions?: Record<TargetId, IPosition>;
  itemTargetIds?: Record<ItemId, TargetId>;
}

export type TargetId = string;

export interface IDropZone {
  id: TargetId;
  targetWidth: number;
  targetHeight: number;
  targetLabel?: string;
  index: number;
}

export interface IAuthoredState extends IAuthoringInteractiveMetadata {
  version: number;
  prompt?: string;
  draggingAreaPrompt?: string;
  required?: boolean;
  hint?: string;
  canvasWidth?: number;
  canvasHeight?: number;
  backgroundImageUrl?: string;
  draggableItems?: IDraggableItem[];
  dropZones?: IDropZone[];
  initialState?: IInitialState;
}

export interface IDroppedItem {
  targetId: string;
  droppedItem: IDraggableItem;
}

export interface IInteractiveState extends IRuntimeInteractiveMetadata {
  submitted?: boolean;
  itemPositions?: Record<ItemId, IPosition>;
  droppedItemData?: Record<ItemId, IDroppedItem>;
}
