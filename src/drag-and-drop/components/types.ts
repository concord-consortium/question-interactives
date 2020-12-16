import { IAuthoringInteractiveMetadata, IRuntimeInteractiveMetadata } from "@concord-consortium/lara-interactive-api";

export type ItemId = string;

export interface IDraggableItem {
  id: ItemId;
  imageUrl?: string;
}

export interface IPosition {
  left: number;
  top: number;
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
  draggableItems?: IDraggableItem[]
}

export interface IInteractiveState extends IRuntimeInteractiveMetadata {
  submitted?: boolean;
  itemPositions?: Record<ItemId, IPosition>;
}
