import React from "react";
import { act } from "react-dom/test-utils";
import { mount, ReactWrapper } from "enzyme";
import { Runtime } from "./runtime";
import { DemoAuthoredState, IAuthoredState } from "./types";
import { InitMessageContext } from "@concord-consortium/question-interactives-helpers/src/hooks/use-context-init-message";
import * as api from "@concord-consortium/lara-interactive-api";

jest.mock("@concord-consortium/lara-interactive-api");
jest.mock("@concord-consortium/object-storage", () => ({
  useObjectStorage: () => ({
    readMetadata: jest.fn(),
    readDataItem: jest.fn(),
  }),
}));
jest.mock("react-chartjs-2", () => ({
  Line: (props: any) => <canvas data-testid="chart-canvas" />,
}));
jest.mock("chart.js", () => ({
  Chart: { register: jest.fn() },
  CategoryScale: {},
  LinearScale: {},
  LineElement: {},
  PointElement: {},
  Title: {},
  Tooltip: {},
  Legend: {},
}));

const mockApi = api as any;

const renderRuntime = (
  authoredState: IAuthoredState,
  linkedInteractiveId?: string
): ReactWrapper => {
  const initMessage: any = {
    mode: "runtime",
    linkedInteractives: linkedInteractiveId
      ? [{ label: "dataSourceInteractive", id: linkedInteractiveId }]
      : [],
  };
  return mount(
    <InitMessageContext.Provider value={initMessage}>
      <Runtime authoredState={authoredState} />
    </InitMessageContext.Provider>
  );
};

const emit = (message: any) => {
  act(() => {
    mockApi.__emitMessage(message);
  });
};

describe("Runtime viewState rendering", () => {
  beforeEach(() => {
    mockApi.__resetMockChannels?.();
  });

  it("renders the custom no-source message when no source is linked", () => {
    const wrapper = renderRuntime({
      ...DemoAuthoredState,
      noSourceMessage: "Custom no source",
    });
    expect(wrapper.find("[data-view-state='no-source']").exists()).toBe(true);
    expect(wrapper.text()).toContain("Custom no source");
  });

  it("falls back to the default no-source message when authored message is blank", () => {
    const wrapper = renderRuntime(DemoAuthoredState);
    expect(wrapper.text()).toContain("No data source configured");
  });

  it("renders the custom no-data message in waiting state", () => {
    const wrapper = renderRuntime(
      { ...DemoAuthoredState, noDataMessage: "Hold on…" },
      "interactive_1"
    );
    expect(wrapper.find("[data-view-state='waiting']").exists()).toBe(true);
    expect(wrapper.text()).toContain("Hold on…");
  });

  it("falls back to the default waiting message", () => {
    const wrapper = renderRuntime(DemoAuthoredState, "interactive_1");
    expect(wrapper.text()).toContain("Waiting for data...");
  });

  it("renders the x-axis-missing warning with role='alert' and assertive aria-live", () => {
    const wrapper = renderRuntime(
      { ...DemoAuthoredState, xAxisColumn: "time" },
      "interactive_1"
    );
    emit({ topic: "recording-started", cols: ["a", "b"] });
    wrapper.update();
    const assertiveRegion = wrapper.find("[aria-live='assertive']");
    expect(assertiveRegion.text()).toMatch(/can't be displayed/);
    expect(assertiveRegion.prop("role")).toBe("alert");
  });

  it("renders the filter-empty message in the polite region", () => {
    const wrapper = renderRuntime(
      {
        ...DemoAuthoredState,
        columnFilteringMode: "allow",
        allowList: "zzz",
      },
      "interactive_1"
    );
    emit({ topic: "recording-started", cols: ["a", "b"] });
    wrapper.update();
    const politeRegion = wrapper.find("[aria-live='polite']").first();
    expect(politeRegion.text()).toMatch(/No columns to display\. There may be a problem/);
  });

  it("renders the Chart when plotting", () => {
    const wrapper = renderRuntime(DemoAuthoredState, "interactive_1");
    emit({ topic: "recording-started", cols: ["a", "b"] });
    wrapper.update();
    expect(wrapper.find("[data-view-state='plotting']").exists()).toBe(true);
    expect(wrapper.find("[data-testid='chart-canvas']").exists()).toBe(true);
  });

  it("has ARIA label derived from chart title", () => {
    const wrapper = renderRuntime(
      { ...DemoAuthoredState, chartTitle: "Test Chart" },
      "interactive_1"
    );
    expect(wrapper.find("[aria-label='Live graph: Test Chart']").exists()).toBe(true);
  });

  it("has fallback ARIA label when title is blank", () => {
    const wrapper = renderRuntime(DemoAuthoredState, "interactive_1");
    expect(wrapper.find("[aria-label='Live graph']").exists()).toBe(true);
  });
});
