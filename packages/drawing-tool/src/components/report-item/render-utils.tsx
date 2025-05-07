import React from "react";
import type { FabricObject } from "./types";

export const fabricPathToSvg = (path: (string | number)[][]): string => {
  if (path.length === 0) return "";
  const segments = path.map(([cmd, ...coords]) => cmd ? `${cmd} ${coords.join(" ")}` : "").filter(Boolean);
  return segments.join(" ").trim();
};

export const renderObject = (obj: FabricObject, i: number): JSX.Element | null => {
  switch (obj.type) {
    case "ellipse":
      return (
        <ellipse
          key={i}
          fill={obj.fill || "none"}
          cx={obj.left}
          cy={obj.top}
          opacity={obj.opacity}
          rx={obj.rx}
          ry={obj.ry}
          stroke={obj.stroke}
          strokeWidth={obj.strokeWidth}
        />
      );
    case "i-text":
      return (
        <text
          key={i}
          fill={obj.fill || "none"}
          fontFamily={obj.fontFamily}
          fontSize={obj.fontSize}
          fontWeight={obj.fontWeight}
          x={obj.left}
          y={obj.top + obj.fontSize}
        >
          {obj.text}
        </text>
      );
    case "line":
      return (
        <line
          key={i}
          opacity={obj.opacity}
          stroke={obj.stroke}
          strokeWidth={obj.strokeWidth}
          x1={obj.left + obj.x1}
          y1={obj.top + obj.y1}
          x2={obj.left + obj.x2}
          y2={obj.top + obj.y2}
        />
      );
    case "path":
      return (
        <path
          key={i}
          d={fabricPathToSvg(obj.path)}
          fill={obj.fill || "none"}
          opacity={obj.opacity}
          stroke={obj.stroke}
          strokeWidth={obj.strokeWidth}
        />
      );
    case "rect": {
      // Fabric rectangles are positioned based on originX / originY, which can be "left" / "top" or "center".
      // SVG rect elements, however, always use the top-left corner as the origin, so we adjust the position
      // here as needed to ensure correct rendering in the SVG.
      const originX = obj.originX ?? "left";
      const originY = obj.originY ?? "top";
      const x = originX === "center" ? obj.left - obj.width / 2 : obj.left;
      const y = originY === "center" ? obj.top - obj.height / 2 : obj.top;
    
      return (
        <rect
          key={i}
          height={obj.height}
          fill={obj.fill || "none"}
          opacity={obj.opacity}
          stroke={obj.stroke}
          strokeWidth={obj.strokeWidth}
          width={obj.width}
          x={x}
          y={y}
        />
      );
    }
    default:
      return null;
  }
};
