import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";

import { CircularSliderWidget } from "./circular-slider-widget";

describe("CircularSliderWidget", () => {
  let mockGlobals: Map<string, any>;
  let mockSim: any;

  beforeEach(() => {
    mockGlobals = new Map();
    mockSim = {
      globals: {
        get: (key: string) => mockGlobals.get(key),
        set: (key: string, value: any) => mockGlobals.set(key, value)
      }
    };
  });

  const defaultData = {
    label: "Test Label Text",
    min: 0,
    max: 100,
    showReadout: true
  };

  function renderWidget(props: any = {}) {
    return render(
      <CircularSliderWidget
        data={{ ...defaultData, ...(props.data || {}) }}
        globalKey={props.globalKey || "foo"}
        isRecording={props.isRecording ?? false}
        sim={mockSim}
        type={"circular-slider"}
        {...props}
      />
    );
  }

  describe("error handling", () => {
    it("shows error if data is missing", () => {
      renderWidget({ data: undefined });
      expect(screen.getByText(/missing data/i)).toBeInTheDocument();
    });

    it("shows error if min or max is non-numeric", () => {
      renderWidget({ data: { label: "Test", min: NaN, max: 100 } });
      expect(screen.getByText(/requires numeric min and max/i)).toBeInTheDocument();
    });

    it("shows error if min >= max", () => {
      renderWidget({ data: { label: "Test", min: 10, max: 5 } });
      expect(screen.getByText(/min value to be less than max/i)).toBeInTheDocument();
    });

    it("shows error if label is missing", () => {
      renderWidget({ data: { min: 0, max: 100 } });
      expect(screen.getByText(/requires a label/i)).toBeInTheDocument();
    });

    it("shows error if step is non-positive", () => {
      renderWidget({ data: { label: "Test", min: 0, max: 100, step: -5 } });
      expect(screen.getByText(/step must be a positive number/i)).toBeInTheDocument();
    });

    it("shows error if global value is non-numeric", () => {
      mockGlobals.set("foo", "not-a-number");
      renderWidget();
      expect(screen.getByText(/requires a global with a numeric value/i)).toBeInTheDocument();
    });
  });

  describe("rendered elements", () => {
    it("renders without crashing", () => {
      mockGlobals.set("foo", 42);
      renderWidget();
      expect(screen.getByTestId("circular-slider")).toBeInTheDocument();
      expect(screen.getByTestId("circular-slider-label")).toBeInTheDocument();
      expect(screen.getByTestId("circular-slider-container")).toBeInTheDocument();
    });
    it("renders with input", () => {
      mockGlobals.set("foo", 42);
      renderWidget();
      expect(screen.getByTestId("slider-widget-input")).toHaveValue(42);
    });
    it("renders without input when `showReadout` is false or undefined", () => {
      mockGlobals.set("foo", 42);
      renderWidget({ data: { ...defaultData, showReadout: false } });
      expect(screen.queryByTestId("slider-widget-input")).toBeNull();

      renderWidget({ data: { ...defaultData, showReadout: undefined } });
      expect(screen.queryByTestId("slider-widget-input")).toBeNull();
    });
  });

  describe("functionality", () => {
    it("clamps input value to min/max", () => {
      mockGlobals.set("foo", 10);
      renderWidget();
      const input = screen.getByTestId("slider-widget-input");
      fireEvent.change(input, { target: { value: "-5" } });
      expect(mockGlobals.get("foo")).toBe(0);
      fireEvent.change(input, { target: { value: "150" } });
      expect(mockGlobals.get("foo")).toBe(100);
    });

    it("disables input when isRecording is true", () => {
      mockGlobals.set("foo", 50);
      renderWidget({ isRecording: true });
      const input = screen.getByTestId("slider-widget-input");
      expect(input).toBeDisabled();
    });
  });
});
