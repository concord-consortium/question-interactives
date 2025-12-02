import React from "react";
import { render, screen } from "@testing-library/react";
import { ReadoutWidget, readoutWidgetType } from "./readout-widget";

describe("ReadoutWidget", () => {
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

  function renderWidget(props: any = {}) {
    return render(
      <ReadoutWidget
        data={{}}
        globalKey="testValue"
        type={readoutWidgetType}
        sim={mockSim}
        isRecording={false}
        {...props}
      />
    );
  }

  describe("basic rendering", () => {
    it("renders label and value with default integer format", () => {
      mockGlobals.set("testValue", 42.7);

      renderWidget({ data: { label: "Test Label" } });

      expect(screen.getByText(/Test Label/)).toBeInTheDocument();
      expect(screen.getByText("43")).toBeInTheDocument();
    });

    it("renders without label", () => {
      mockGlobals.set("testValue", 123.4);

      const { container } = renderWidget();

      expect(container.querySelector("output")).toHaveTextContent("123");
    });

    it("renders with unit", () => {
      mockGlobals.set("temperature", 23.5);

      renderWidget({
        data: { label: "Temp", unit: "°C" },
        globalKey: "temperature"
      });

      expect(screen.getByText(/24 °C/)).toBeInTheDocument();
    });
  });

  describe("number formatting", () => {
    describe("decimal format", () => {
      it("uses default 2 decimal places when precision not specified", () => {
        mockGlobals.set("value", 123.456789);

        renderWidget({
          data: { formatType: "decimal" },
          globalKey: "value"
        });

        expect(screen.getByText("123.46")).toBeInTheDocument();
      });

      it("formats with specified decimal places", () => {
        mockGlobals.set("value", 123.456789);

        renderWidget({
          data: { formatType: "decimal", precision: 1 },
          globalKey: "value"
        });

        expect(screen.getByText("123.5")).toBeInTheDocument();
      });

      it("formats with explicit 0 decimal places", () => {
        mockGlobals.set("value", 123.789);

        renderWidget({
          data: { formatType: "decimal", precision: 0 },
          globalKey: "value"
        });

        expect(screen.getByText("124")).toBeInTheDocument();
      });
    });

    describe("integer format", () => {
      it("rounds to nearest integer", () => {
        mockGlobals.set("count", 42.7);

        renderWidget({
          data: { formatType: "integer" },
          globalKey: "count"
        });

        expect(screen.getByText("43")).toBeInTheDocument();
      });

      it("ignores precision parameter for integer format", () => {
        mockGlobals.set("count", 42.123);

        renderWidget({
          data: { formatType: "integer", precision: 5 },
          globalKey: "count"
        });

        expect(screen.getByText("42")).toBeInTheDocument();
      });

      it("handles negative integers", () => {
        mockGlobals.set("value", -15.8);

        renderWidget({
          data: { formatType: "integer" },
          globalKey: "value"
        });

        expect(screen.getByText("-16")).toBeInTheDocument();
      });
    });

    describe("percent format", () => {
      it("multiplies by 100 and adds percent sign with default 0 decimal places", () => {
        mockGlobals.set("ratio", 0.753);

        renderWidget({
          data: { formatType: "percent" },
          globalKey: "ratio"
        });

        expect(screen.getByText("75 %")).toBeInTheDocument();
      });

      it("formats percentage with specified precision", () => {
        mockGlobals.set("ratio", 0.12345);

        renderWidget({
          data: { formatType: "percent", precision: 1 },
          globalKey: "ratio"
        });

        expect(screen.getByText("12.3 %")).toBeInTheDocument();
      });

      it("formats percentage with 0 precision", () => {
        mockGlobals.set("ratio", 0.876);

        renderWidget({
          data: { formatType: "percent", precision: 0 },
          globalKey: "ratio"
        });

        expect(screen.getByText("88 %")).toBeInTheDocument();
      });

      it("handles percentages over 100%", () => {
        mockGlobals.set("growth", 1.5);

        renderWidget({
          data: { formatType: "percent", precision: 0 },
          globalKey: "growth"
        });

        expect(screen.getByText("150 %")).toBeInTheDocument();
      });
    });
  });

  describe("styling", () => {
    it("applies custom colors", () => {
      mockGlobals.set("value", 42);

      const { container } = renderWidget({
        data: {
          backgroundColor: "#ff0000",
          color: "#0000ff"
        },
        globalKey: "value"
      });

      const widget = container.firstChild as HTMLElement;
      expect(widget.style.backgroundColor).toBe("rgb(255, 0, 0)");
      expect(widget.style.color).toBe("rgb(0, 0, 255)");
    });
  });

  describe("accessibility", () => {
    it("properly associates label with output using aria-labelledby", () => {
      mockGlobals.set("temp", 25);

      const { container } = renderWidget({
        data: { label: "Temperature" },
        globalKey: "temp"
      });

      const label = container.querySelector("label");
      const output = container.querySelector("output");

      expect(label).toHaveAttribute("id", "label-temp");
      expect(output).toHaveAttribute("aria-labelledby", "label-temp");
    });

    it("sanitizes the globalKey for id attributes", () => {
      mockGlobals.set("my.special@key!", 100);

      const { container } = renderWidget({
        data: { label: "Value" },
        globalKey: "energy value!"
      });

      const label = container.querySelector("label");
      expect(label).toHaveAttribute("id", "label-energy_value_");
    });
  });
});
