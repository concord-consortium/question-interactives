import React from "react";
import { render } from "@testing-library/react";
import { fabricPathToSvg, renderObject } from "./render-utils";
import type { FabricObject } from "./types";

describe("fabricPathToSvg", () => {
  it("should convert a fabric path to an SVG path string", () => {
    const fabricPath = [
      ["M", 10, 10],
      ["L", 20, 20]
    ];
    const svgPath = fabricPathToSvg(fabricPath);
    expect(svgPath).toBe("M 10 10 L 20 20");
  });

  it("should handle empty paths", () => {
    expect(fabricPathToSvg([])).toBe("");
    expect(fabricPathToSvg([[]])).toBe("");
  });
});

describe("renderObject", () => {
  it("should render an ellipse", () => {
    const obj: FabricObject = {
      type: "ellipse",
      left: 100,
      top: 100,
      rx: 50,
      ry: 30,
      fill: "red",
      stroke: "black",
      strokeWidth: 2,
      opacity: 0.8
    };
    const { container } = render(<>{renderObject(obj, 0)}</>);
    const ellipse = container.querySelector("ellipse");
    expect(ellipse).toHaveAttribute("cx", "100");
    expect(ellipse).toHaveAttribute("cy", "100");
    expect(ellipse).toHaveAttribute("rx", "50");
    expect(ellipse).toHaveAttribute("ry", "30");
    expect(ellipse).toHaveAttribute("fill", "red");
    expect(ellipse).toHaveAttribute("stroke", "black");
    expect(ellipse).toHaveAttribute("stroke-width", "2");
    expect(ellipse).toHaveAttribute("opacity", "0.8");
  });

  it("should render text", () => {
    const obj: FabricObject = {
      type: "i-text",
      left: 100,
      top: 100,
      text: "Hello",
      fontSize: 16,
      fontFamily: "Arial",
      fontWeight: "bold",
      fill: "blue"
    };
    const { container } = render(<>{renderObject(obj, 0)}</>);
    const text = container.querySelector("text");
    expect(text).toHaveAttribute("x", "100");
    expect(text).toHaveAttribute("y", "116"); // top + fontSize
    expect(text).toHaveAttribute("font-family", "Arial");
    expect(text).toHaveAttribute("font-size", "16");
    expect(text).toHaveAttribute("font-weight", "bold");
    expect(text).toHaveAttribute("fill", "blue");
    expect(text).toHaveTextContent("Hello");
  });

  it("should render a line", () => {
    const obj: FabricObject = {
      type: "line",
      left: 100,
      top: 100,
      x1: 0,
      y1: 0,
      x2: 50,
      y2: 50,
      stroke: "black",
      strokeWidth: 2,
      opacity: 0.8
    };
    const { container } = render(<>{renderObject(obj, 0)}</>);
    const line = container.querySelector("line");
    expect(line).toHaveAttribute("x1", "100");
    expect(line).toHaveAttribute("y1", "100");
    expect(line).toHaveAttribute("x2", "150");
    expect(line).toHaveAttribute("y2", "150");
    expect(line).toHaveAttribute("stroke", "black");
    expect(line).toHaveAttribute("stroke-width", "2");
    expect(line).toHaveAttribute("opacity", "0.8");
  });

  it("should render a path", () => {
    const obj: FabricObject = {
      type: "path",
      left: 100,
      top: 100,
      path: [["M", 10, 10, "L", 20, 20]],
      fill: "red",
      stroke: "black",
      strokeWidth: 2,
      opacity: 0.8
    };
    const { container } = render(<>{renderObject(obj, 0)}</>);
    const path = container.querySelector("path");
    expect(path).toHaveAttribute("d", "M 10 10 L 20 20");
    expect(path).toHaveAttribute("fill", "red");
    expect(path).toHaveAttribute("stroke", "black");
    expect(path).toHaveAttribute("stroke-width", "2");
    expect(path).toHaveAttribute("opacity", "0.8");
  });

  it("should render a rectangle with center origin", () => {
    const obj: FabricObject = {
      type: "rect",
      left: 100,
      top: 100,
      width: 50,
      height: 30,
      originX: "center",
      originY: "center",
      fill: "red",
      stroke: "black",
      strokeWidth: 2,
      opacity: 0.8
    };
    const { container } = render(<>{renderObject(obj, 0)}</>);
    const rect = container.querySelector("rect");
    expect(rect).toHaveAttribute("x", "75"); // left - width/2
    expect(rect).toHaveAttribute("y", "85"); // top - height/2
    expect(rect).toHaveAttribute("width", "50");
    expect(rect).toHaveAttribute("height", "30");
    expect(rect).toHaveAttribute("fill", "red");
    expect(rect).toHaveAttribute("stroke", "black");
    expect(rect).toHaveAttribute("stroke-width", "2");
    expect(rect).toHaveAttribute("opacity", "0.8");
  });

  it("should render a rectangle with left/top origin", () => {
    const obj: FabricObject = {
      type: "rect",
      left: 100,
      top: 100,
      width: 50,
      height: 30,
      originX: "left",
      originY: "top",
      fill: "red",
      stroke: "black",
      strokeWidth: 2,
      opacity: 0.8
    };
    const { container } = render(<>{renderObject(obj, 0)}</>);
    const rect = container.querySelector("rect");
    expect(rect).toHaveAttribute("x", "100");
    expect(rect).toHaveAttribute("y", "100");
    expect(rect).toHaveAttribute("width", "50");
    expect(rect).toHaveAttribute("height", "30");
  });

  it("should return null for unknown object types", () => {
    const obj = { 
      type: "unknown",
      left: 0,
      top: 0
    } as unknown as FabricObject;
    expect(renderObject(obj, 0)).toBeNull();
  });
});
