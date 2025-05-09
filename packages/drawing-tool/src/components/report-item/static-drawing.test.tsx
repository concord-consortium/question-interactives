import React from "react";
import { render } from "@testing-library/react";
import { StaticDrawing } from "./static-drawing";
import { renderObject } from "./render-utils";

jest.mock("./render-utils", () => ({
  renderObject: jest.fn()
}));

const mockRenderObject = renderObject as jest.Mock;

describe("StaticDrawing", () => {
  const drawingState = JSON.stringify({
    dt: { width: 600, height: 600 },
    canvas: {
      objects: [
        { type: "rect", left: 10, top: 10, width: 50, height: 50 },
        { type: "circle", left: 100, top: 100, radius: 25 }
      ],
      background: "#fff"
    }
  });

  beforeEach(() => {
    mockRenderObject.mockClear();
    mockRenderObject.mockImplementation((obj, i) => <div key={i} data-testid={`object-${i}`}>{obj.type}</div>);
  });

  it("renders an SVG with correct dimensions and background", () => {
    const { container } = render(<StaticDrawing drawingState={drawingState} />);
    const svg = container.querySelector("svg");
    
    expect(svg).toHaveAttribute("width", "100%");
    expect(svg).toHaveAttribute("height", "100%");
    expect(svg).toHaveAttribute("viewBox", "0 0 600 600");
    expect(svg).toHaveStyle({ background: "#fff", display: "block" });
  });

  it("renders a container div with correct aspect ratio and styling", () => {
    const { container } = render(<StaticDrawing drawingState={drawingState} />);
    const div = container.firstChild as HTMLElement;

    expect(div.style.aspectRatio).toBe("600 / 600");
    expect(div.style.border).toBe("1px solid #777");
    expect(div.style.maxWidth).toBe("600px");
    expect(div.style.width).toBe("100%");
  });

  it("calls renderObject for each canvas object", () => {
    render(<StaticDrawing drawingState={drawingState} />);
    
    expect(mockRenderObject).toHaveBeenCalledTimes(2);
    expect(mockRenderObject.mock.calls[0][0]).toEqual(
      { type: "rect", left: 10, top: 10, width: 50, height: 50 }
    );
    expect(mockRenderObject.mock.calls[0][1]).toBe(0);
    expect(mockRenderObject.mock.calls[1][0]).toEqual(
      { type: "circle", left: 100, top: 100, radius: 25 }
    );
    expect(mockRenderObject.mock.calls[1][1]).toBe(1);
  });

  it("renders objects returned by renderObject", () => {
    const { getByTestId } = render(<StaticDrawing drawingState={drawingState} />);
    
    expect(getByTestId("object-0")).toHaveTextContent("rect");
    expect(getByTestId("object-1")).toHaveTextContent("circle");
  });

  it("handles missing drawingState", () => {
    const { container } = render(<StaticDrawing />);
    const svg = container.querySelector("svg");
    
    expect(svg).toHaveAttribute("viewBox", "0 0 600 600");
    expect(svg).toHaveStyle({ background: "#fff" });
    expect(mockRenderObject).not.toHaveBeenCalled();
  });

  it("uses default values when properties are missing", () => {
    const minimalState = JSON.stringify({
      canvas: {}
    });
    const { container } = render(<StaticDrawing drawingState={minimalState} />);
    const svg = container.querySelector("svg");
    
    expect(svg).toHaveAttribute("viewBox", "0 0 600 600");
    expect(svg).toHaveStyle({ background: "#fff" });
  });
});
