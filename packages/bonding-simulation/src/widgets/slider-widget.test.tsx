import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";

import { SliderWidget, sliderWidgetType } from "./slider-widget";


describe("SliderWidget", () => {

  let mockGlobals: Map<string, any>;
  let mockSim: any;
  const defaultData = { label: "Primary Label Text", min: 0, max: 100 };

  beforeEach(() => {
    mockGlobals = new Map();
    mockSim = {
      globals: {
        get: (key: string) => mockGlobals.get(key),
        set: (key: string, value: any) => mockGlobals.set(key, value)
      }
    };
  });

  function renderWidget(props: any = {}) {
    return render(
      <SliderWidget
        data={{ ...defaultData, ...(props.data || {}) }}
        globalKey={props.globalKey || "foo"}
        isRecording={props.isRecording ?? false}
        isCompletedRecording={props.isCompletedRecording ?? false}
        sim={mockSim}
        type={sliderWidgetType}
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
    it("renders only with label when optional elements are not specified", () => {
      mockGlobals.set("foo", 42);
      renderWidget({ data: defaultData });
      expect(screen.getByTestId("slider-widget-label")).toHaveTextContent("Primary Label Text");
      expect(screen.queryByTestId("slider-widget-input")).toBeNull();
      expect(screen.queryByTestId("slider-widget-secondary-label")).toBeNull();
      expect(screen.queryByTestId("slider-widget-unit")).toBeNull();
    });

    it("renders with a readout value when `showReadout` is true", () => {
      mockGlobals.set("foo", 42);
      renderWidget({ data: { ...defaultData, showReadout: true } });
      expect(screen.getByTestId("slider-widget-input")).toHaveValue(42);
    });

    it("renders the unit when specified and `showReadout` is true", () => {
      mockGlobals.set("foo", 5);
      renderWidget({ data: { ...defaultData, showReadout: true, unit: "kg" } });
      expect(screen.getByTestId("slider-widget-unit")).toHaveTextContent("kg");
    });

    it("renders the secondary label when specified", () => {
      mockGlobals.set("foo", 20);
      renderWidget({ data: { ...defaultData, secondaryLabel: "Secondary Label Text" } });
      expect(screen.getByTestId("slider-widget-secondary-label")).toHaveTextContent("Secondary Label Text");
    });

    it("renders slider element inside slider-widget-slider-body", () => {
      mockGlobals.set("foo", 50);
      renderWidget();
      const sliderBody = screen.getByTestId("slider-widget-slider-body");
      expect(sliderBody.querySelector(".rcSlider")).toBeInTheDocument();
    });
  });

  describe("functionality", () => {
    it("updates value on input change after blur", () => {
      mockGlobals.set("foo", 10);
      renderWidget({ data: { ...defaultData, showReadout: true } });
      const input = screen.getByTestId("slider-widget-input");
      fireEvent.focus(input);
      fireEvent.change(input, { target: { value: "15" } });
      // Value should not update immediately due to debouncing
      expect(mockGlobals.get("foo")).toBe(10);
      // Value updates after blur
      fireEvent.blur(input);
      expect(mockGlobals.get("foo")).toBe(15);
    });

    it("disables slider when isCompletedRecording is true", () => {
      mockGlobals.set("foo", 50);
      const { container } = renderWidget({ isCompletedRecording: true });
      const slider = container.querySelector(".rc-slider");
      expect(slider).toHaveClass("rc-slider-disabled");
    });
  });

  describe("recorded global values", () => {
    it("uses recorded value when viewing a completed recording", () => {
      // Current sim value is 50, but recorded value was 25
      mockGlobals.set("foo", 50);
      renderWidget({
        data: { ...defaultData, showReadout: true },
        isCompletedRecording: true,
        recordedGlobalValues: { foo: 25 }
      });

      const input = screen.getByTestId("slider-widget-input");
      expect(input).toHaveValue(25);
    });

    it("uses sim value when not viewing a completed recording", () => {
      mockGlobals.set("foo", 50);
      renderWidget({
        data: { ...defaultData, showReadout: true },
        isCompletedRecording: false,
        recordedGlobalValues: { foo: 25 }
      });

      const input = screen.getByTestId("slider-widget-input");
      expect(input).toHaveValue(50);
    });

    it("uses sim value when recordedGlobalValues is undefined", () => {
      mockGlobals.set("foo", 50);
      renderWidget({
        data: { ...defaultData, showReadout: true },
        isCompletedRecording: true,
        recordedGlobalValues: undefined
      });

      const input = screen.getByTestId("slider-widget-input");
      expect(input).toHaveValue(50);
    });

    it("uses sim value when recorded value for this key is undefined", () => {
      mockGlobals.set("foo", 50);
      renderWidget({
        data: { ...defaultData, showReadout: true },
        isCompletedRecording: true,
        recordedGlobalValues: { bar: 25 } // Different key
      });

      const input = screen.getByTestId("slider-widget-input");
      expect(input).toHaveValue(50);
    });
  });
});
