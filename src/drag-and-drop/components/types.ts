import { IAuthoringInteractiveMetadata, IRuntimeInteractiveMetadata } from "@concord-consortium/lara-interactive-api";

export type ItemId = string;

export interface IDraggableItem {
  id: ItemId;
  imageUrl?: string;
  imageWidth: number;
  imageHeight: number;
}

export interface IPosition {
  left: number;
  top: number;
}

export interface IInitialState {
  itemPositions?: Record<ItemId, IPosition>;
  itemsInTarget?: IDraggableItem[];
}

export type TargetId = string;

export interface IDragTarget {
  id: TargetId;
  imageUrl?: string;
  targetWidth: number;
  targetHeight: number;
  targetabel?: string;
  index: number;
}

export interface IAuthoredState extends IAuthoringInteractiveMetadata {
  targetPositions?: Record<string, IPosition>;
  version: number;
  prompt?: string;
  draggingAreaPrompt?: string;
  required?: boolean;
  hint?: string;
  canvasWidth?: number;
  canvasHeight?: number;
  backgroundImageUrl?: string;
  draggableItems?: IDraggableItem[];
  dragTargets?: IDragTarget[];
  initialState?: IInitialState;
}

export interface IInteractiveState extends IRuntimeInteractiveMetadata {
  submitted?: boolean;
  itemPositions?: Record<ItemId, IPosition>;
  itemsInTarget?: IDraggableItem[];
}
