import React from "react";
import { FabricObject } from "./types";
import { renderObject } from "./render-utils";

interface IDrawingProps {
  drawingState?: string;
}

export const StaticDrawing = ({ drawingState }: IDrawingProps) => {
  const { dt = {}, canvas = {} } = drawingState ? JSON.parse(drawingState) : {};
  const width = dt.width ?? 600;
  const height = dt.height ?? 600;
  const objects: FabricObject[] = canvas.objects ?? [];
  const background = canvas.background ?? "#fff";

  return (
    <div style={{ aspectRatio: `${width} / ${height}`, border: "solid 1px #777", maxWidth: "600px", width: "100%" }}>
      <svg
        width="100%"
        height="100%"
        viewBox={`0 0 ${width} ${height}`}
        style={{ background, display: "block" }}
      >
        {objects.map(renderObject)}
      </svg>
    </div>
  );
};
