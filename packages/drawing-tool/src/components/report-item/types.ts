type FabricBase = {
  fill?: string;
  left: number;
  opacity?: number;
  stroke?: string;
  strokeWidth?: number;
  top: number;
};

type FabricEllipse = FabricBase & {
  rx: number;
  ry: number;
  type: "ellipse";
};

type FabricLine = FabricBase & {
  x1: number;
  x2: number;
  y1: number;
  y2: number;
  type: "line";
};

type FabricPath = FabricBase & {
  path: (string | number)[][];
  type: "path";
};

type FabricRect = FabricBase & {
  height: number;
  originX?: string;
  originY?: string;
  type: "rect";
  width: number;
};

type FabricText = FabricBase & {
  fontFamily: string;
  fontSize: number;
  fontWeight: string;
  type: "i-text";
  text: string;
};

export type FabricObject = FabricEllipse | FabricLine | FabricPath | FabricText | FabricRect;
