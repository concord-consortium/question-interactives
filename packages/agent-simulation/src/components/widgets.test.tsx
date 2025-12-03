import React from "react";
import { render, screen } from "@testing-library/react";
import { Widgets } from "./widgets";
import { AgentSimulation } from "../models/agent-simulation";
import { IWidgetComponentProps } from "../types/widgets";
import { widgetData, WidgetData } from "../widgets/widget-registration";
import { computeLayoutForAllWidgets } from "./widget-layout-calculator";

jest.mock("../widgets/widget-registration", () => ({
  widgetData: {}
}));

jest.mock("./widget-layout-calculator", () => ({
  computeLayoutForAllWidgets: jest.fn()
}));

const MockShortWidget = ({ globalKey }: IWidgetComponentProps) => (
  <div data-testid={`widget-${globalKey}`}>Short Widget</div>
);
const MockTallWidget = ({ globalKey }: IWidgetComponentProps) => (
  <div data-testid={`widget-${globalKey}`}>Tall Widget</div>
);
const MockVeryTallWidget = ({ globalKey }: IWidgetComponentProps) => (
  <div data-testid={`widget-${globalKey}`}>Very Tall Widget</div>
);

type MockSim = Pick<AgentSimulation, "widgets">;

describe("Widgets", () => {
  const mockComputeLayout = computeLayoutForAllWidgets as jest.MockedFunction<typeof computeLayoutForAllWidgets>;
  const mockWidgetData = widgetData as Record<string, Partial<WidgetData>>;

  beforeEach(() => {
    jest.clearAllMocks();
    Object.keys(mockWidgetData).forEach(key => delete mockWidgetData[key]);
    jest.spyOn(console, "warn").mockImplementation();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("null sim handling", () => {
    it("returns null when sim is null", () => {
      const { container } = render(<Widgets sim={null} isRecording={false} inRecordingMode={false} />);
      expect(container.firstChild).toBeNull();
    });
  });

  describe("basic rendering", () => {
    it("renders widgets container when sim has widgets", () => {
      mockWidgetData["test-widget"] = { component: MockShortWidget, size: "short" as import("../types/widgets").WidgetSize };
      mockComputeLayout.mockReturnValue([
        { col: 0 as 0 | 1, gridRowStart: 0, gridRowEnd: 1, size: "short" as import("../types/widgets").WidgetSize, spansFullWidth: false }
      ]);
      const mockSim: MockSim = {
        widgets: [{ type: "test-widget", globalKey: "widget1", data: {} }]
      };
      render(<Widgets sim={mockSim as AgentSimulation} isRecording={false} inRecordingMode={false} />);
      expect(screen.getByTestId("widget-widget1")).toBeInTheDocument();
    });

    it("renders multiple widgets", () => {
      mockWidgetData["short-widget"] = { component: MockShortWidget, size: "short" as import("../types/widgets").WidgetSize };
      mockWidgetData["tall-widget"] = { component: MockTallWidget, size: "tall" as import("../types/widgets").WidgetSize };
      mockComputeLayout.mockReturnValue([
        { col: 0 as 0 | 1, gridRowStart: 0, gridRowEnd: 1, size: "short" as import("../types/widgets").WidgetSize, spansFullWidth: false },
        { col: 1 as 0 | 1, gridRowStart: 0, gridRowEnd: 2, size: "tall" as import("../types/widgets").WidgetSize, spansFullWidth: false }
      ]);
      const mockSim: MockSim = {
        widgets: [
          { type: "short-widget", globalKey: "widget1", data: {} },
          { type: "tall-widget", globalKey: "widget2", data: {} }
        ]
      };
      render(<Widgets sim={mockSim as AgentSimulation} isRecording={false} inRecordingMode={false} />);
      expect(screen.getByTestId("widget-widget1")).toBeInTheDocument();
      expect(screen.getByTestId("widget-widget2")).toBeInTheDocument();
    });
  });

  describe("widget validation", () => {
    it("filters out widgets with no registration", () => {
      mockWidgetData["valid-widget"] = { component: MockShortWidget, size: "short" as import("../types/widgets").WidgetSize };
      mockComputeLayout.mockReturnValue([
        { col: 0 as 0 | 1, gridRowStart: 0, gridRowEnd: 1, size: "short" as import("../types/widgets").WidgetSize, spansFullWidth: false }
      ]);
      const mockSim: MockSim = {
        widgets: [
          { type: "valid-widget", globalKey: "widget1", data: {} },
          { type: "invalid-widget", globalKey: "widget2", data: {} }
        ]
      };
      render(<Widgets sim={mockSim as AgentSimulation} isRecording={false} inRecordingMode={false} />);
      expect(screen.getByTestId("widget-widget1")).toBeInTheDocument();
      expect(screen.queryByTestId("widget-widget2")).not.toBeInTheDocument();
      expect(console.warn).toHaveBeenCalledWith("No widget registration found for type: 'invalid-widget'");
      expect(mockComputeLayout).toHaveBeenCalledWith(["short"]);
    });

    it("filters out widgets with missing size property", () => {
      mockWidgetData["valid-widget"] = { component: MockShortWidget, size: "short" as import("../types/widgets").WidgetSize };
      mockWidgetData["no-size-widget"] = { component: MockShortWidget };
      mockComputeLayout.mockReturnValue([
        { col: 0 as 0 | 1, gridRowStart: 0, gridRowEnd: 1, size: "short" as import("../types/widgets").WidgetSize, spansFullWidth: false }
      ]);
      const mockSim: MockSim = {
        widgets: [
          { type: "valid-widget", globalKey: "widget1", data: {} },
          { type: "no-size-widget", globalKey: "widget2", data: {} }
        ]
      };
      render(<Widgets sim={mockSim as AgentSimulation} isRecording={false} inRecordingMode={false} />);
      expect(screen.getByTestId("widget-widget1")).toBeInTheDocument();
      expect(screen.queryByTestId("widget-widget2")).not.toBeInTheDocument();
      expect(console.warn).toHaveBeenCalledWith("Widget registration for type 'no-size-widget' is missing a 'size' property.");
      expect(mockComputeLayout).toHaveBeenCalledWith(["short"]);
    });
  });

  describe("CSS classes", () => {
    it("applies correct size class for short widgets", () => {
      mockWidgetData["short-widget"] = { component: MockShortWidget, size: "short" as import("../types/widgets").WidgetSize };
      mockComputeLayout.mockReturnValue([
        { col: 0 as 0 | 1, gridRowStart: 0, gridRowEnd: 1, size: "short" as import("../types/widgets").WidgetSize, spansFullWidth: false }
      ]);
      const mockSim: MockSim = { widgets: [{ type: "short-widget", globalKey: "widget1", data: {} }] };
      const { container } = render(<Widgets sim={mockSim as AgentSimulation} isRecording={false} inRecordingMode={false} />);
      const widgetDiv = container.querySelector('[data-testid="widget-widget1"]')?.parentElement;
      expect(widgetDiv?.className).toContain("widgetShort");
    });

    it("applies correct size class for tall widgets", () => {
      mockWidgetData["tall-widget"] = { component: MockTallWidget, size: "tall" as import("../types/widgets").WidgetSize };
      mockComputeLayout.mockReturnValue([
        { col: 0 as 0 | 1, gridRowStart: 0, gridRowEnd: 2, size: "tall" as import("../types/widgets").WidgetSize, spansFullWidth: false }
      ]);
      const mockSim: MockSim = { widgets: [{ type: "tall-widget", globalKey: "widget1", data: {} }] };
      const { container } = render(<Widgets sim={mockSim as AgentSimulation} isRecording={false} inRecordingMode={false} />);
      const widgetDiv = container.querySelector('[data-testid="widget-widget1"]')?.parentElement;
      expect(widgetDiv?.className).toContain("widgetTall");
    });

    it("applies correct size class for very-tall widgets", () => {
      mockWidgetData["very-tall-widget"] = { component: MockVeryTallWidget, size: "very-tall" as import("../types/widgets").WidgetSize };
      mockComputeLayout.mockReturnValue([
        { col: 0 as 0 | 1, gridRowStart: 0, gridRowEnd: 3, size: "very-tall" as import("../types/widgets").WidgetSize, spansFullWidth: true }
      ]);
      const mockSim: MockSim = { widgets: [{ type: "very-tall-widget", globalKey: "widget1", data: {} }] };
      const { container } = render(<Widgets sim={mockSim as AgentSimulation} isRecording={false} inRecordingMode={false} />);
      const widgetDiv = container.querySelector('[data-testid="widget-widget1"]')?.parentElement;
      expect(widgetDiv?.className).toContain("widgetVeryTall");
    });

    it("applies widgetFullWidth class based on spansFullWidth flag", () => {
      mockWidgetData["short-widget"] = { component: MockShortWidget, size: "short" };
      mockComputeLayout.mockReturnValue([
        { col: 0, gridRowStart: 0, gridRowEnd: 1, size: "short", spansFullWidth: true },
        { col: 0, gridRowStart: 1, gridRowEnd: 2, size: "short", spansFullWidth: false }
      ]);
      const mockSim: MockSim = {
        widgets: [
          { type: "short-widget", globalKey: "widget1", data: {} },
          { type: "short-widget", globalKey: "widget2", data: {} }
        ]
      };
      const { container } = render(<Widgets sim={mockSim as AgentSimulation} isRecording={false} inRecordingMode={false} />);
      const widget1Div = container.querySelector('[data-testid="widget-widget1"]')?.parentElement;
      const widget2Div = container.querySelector('[data-testid="widget-widget2"]')?.parentElement;
      expect(widget1Div?.className).toContain("widgetFullWidth");
      expect(widget2Div?.className).not.toContain("widgetFullWidth");
    });

    it("applies widgetMatchTallHeight class based on spanToMatchTall flag", () => {
      mockWidgetData["tall-widget"] = { component: MockTallWidget, size: "tall" };
      mockWidgetData["short-widget"] = { component: MockShortWidget, size: "short" };
      mockComputeLayout.mockReturnValue([
        { col: 0, gridRowStart: 0, gridRowEnd: 2, size: "tall", spansFullWidth: false },
        { col: 1, gridRowStart: 0, gridRowEnd: 1, size: "short", spansFullWidth: false, spanToMatchTall: true }
      ]);
      const mockSim: MockSim = {
        widgets: [
          { type: "tall-widget", globalKey: "widget1", data: {} },
          { type: "short-widget", globalKey: "widget2", data: {} }
        ]
      };
      const { container } = render(<Widgets sim={mockSim as AgentSimulation} isRecording={false} inRecordingMode={false} />);
      const widget2Div = container.querySelector('[data-testid="widget-widget2"]')?.parentElement;
      expect(widget2Div?.className).toContain("widgetMatchTallHeight");
    });
  });

  describe("layout calculation integration", () => {
    it("calls computeLayoutForAllWidgets with widget sizes", () => {
      mockWidgetData["short-widget"] = { component: MockShortWidget, size: "short" };
      mockWidgetData["tall-widget"] = { component: MockTallWidget, size: "tall" };
      mockWidgetData["very-tall-widget"] = { component: MockVeryTallWidget, size: "very-tall" };
      mockComputeLayout.mockReturnValue([
        { col: 0, gridRowStart: 0, gridRowEnd: 1, size: "short", spansFullWidth: false },
        { col: 1, gridRowStart: 0, gridRowEnd: 2, size: "tall", spansFullWidth: false },
        { col: 0, gridRowStart: 2, gridRowEnd: 5, size: "very-tall", spansFullWidth: true }
      ]);
      const mockSim: MockSim = {
        widgets: [
          { type: "short-widget", globalKey: "widget1", data: {} },
          { type: "tall-widget", globalKey: "widget2", data: {} },
          { type: "very-tall-widget", globalKey: "widget3", data: {} }
        ]
      };
      render(<Widgets sim={mockSim as AgentSimulation} isRecording={false} inRecordingMode={false} />);
      expect(mockComputeLayout).toHaveBeenCalledWith(["short", "tall", "very-tall"]);
    });

    it("uses layout information for each widget", () => {
      mockWidgetData["tall-widget"] = { component: MockTallWidget, size: "tall" };
      mockWidgetData["short-widget"] = { component: MockShortWidget, size: "short" };
      mockComputeLayout.mockReturnValue([
        { col: 0, gridRowStart: 0, gridRowEnd: 2, size: "tall", spansFullWidth: false },
        { col: 1, gridRowStart: 0, gridRowEnd: 1, size: "short", spansFullWidth: false },
        { col: 1, gridRowStart: 1, gridRowEnd: 2, size: "short", spansFullWidth: false },
        { col: 0, gridRowStart: 2, gridRowEnd: 3, size: "short", spansFullWidth: true }
      ]);
      const mockSim: MockSim = {
        widgets: [
          { type: "tall-widget", globalKey: "widget1", data: {} },
          { type: "short-widget", globalKey: "widget2", data: {} },
          { type: "short-widget", globalKey: "widget3", data: {} },
          { type: "short-widget", globalKey: "widget4", data: {} }
        ]
      };
      const { container } = render(<Widgets sim={mockSim as AgentSimulation} isRecording={false} inRecordingMode={false} />);
      const widgetDivs = [2, 3, 4].map(i => container.querySelector(`[data-testid="widget-widget${i}"]`)?.parentElement);
      // Only check the essential layout classes for each widget
      expect(container.querySelector('[data-testid="widget-widget1"]')?.parentElement?.className).not.toContain("widgetFullWidth");
      expect(container.querySelector('[data-testid="widget-widget1"]')?.parentElement?.className).not.toContain("widgetMatchTallHeight");
      widgetDivs.forEach((div, idx) => {
        if (idx === 2) {
          expect(div?.className).toContain("widgetFullWidth");
        } else {
          expect(div?.className).not.toContain("widgetFullWidth");
        }
        expect(div?.className).not.toContain("widgetMatchTallHeight");
      });
    });
  });

  describe("widget component rendering", () => {
    it("renders widget component with correct props", () => {
      const TestWidget = jest.fn(({ globalKey }: IWidgetComponentProps) => (
        <div data-testid={`test-${globalKey}`}>Test Widget</div>
      ));
      mockWidgetData["test-widget"] = { component: TestWidget, size: "short" };

      mockComputeLayout.mockReturnValue([
        { col: 0, gridRowStart: 0, gridRowEnd: 1, size: "short", spansFullWidth: false }
      ]);

      const mockSim: MockSim = {
        widgets: [{ type: "test-widget", globalKey: "widget1", data: { label: "Test" } }]
      };

      render(<Widgets sim={mockSim as AgentSimulation} isRecording={true} inRecordingMode={true} />);

      expect(TestWidget).toHaveBeenCalled();
      const callProps = TestWidget.mock.calls[0][0];
      expect(callProps.type).toBe("test-widget");
      expect(callProps.globalKey).toBe("widget1");
      expect(callProps.data).toEqual({ label: "Test" });
      expect(callProps.sim).toBe(mockSim as AgentSimulation);
      expect(callProps.isRecording).toBe(true);
      expect(callProps.inRecordingMode).toBe(true);
      expect(screen.getByTestId("test-widget1")).toBeInTheDocument();
    });
  });
});

