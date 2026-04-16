import React from "react";
import { act } from "react-dom/test-utils";
import { mount } from "enzyme";
import { Chart, computeAxisBounds } from "./chart";
import { IAuthoredState } from "./types";
import { IActiveColumn } from "./use-live-stream";

// Capture the Line component's latest props so tests can inspect resolved options/data
// without depending on canvas rendering.
const mockLine = jest.fn((_props: any) => <canvas data-testid="chart-canvas" />);
jest.mock("react-chartjs-2", () => ({
  Line: (props: any) => mockLine(props),
}));

const baseAuthoredState: IAuthoredState = {
  version: 1,
  questionType: "iframe_interactive",
  dataSourceInteractive: "interactive_1",
};

const makeCols = (names: string[]): IActiveColumn[] =>
  names.map(n => ({ column: n, label: n }));

beforeEach(() => {
  mockLine.mockClear();
  jest.spyOn(window, "requestAnimationFrame").mockImplementation(
    (cb: any) => {
      return setTimeout(() => cb(0), 0) as unknown as number;
    }
  );
  jest.spyOn(window, "cancelAnimationFrame").mockImplementation(
    (id: any) => clearTimeout(id as any)
  );
});

afterEach(() => {
  (window.requestAnimationFrame as jest.Mock).mockRestore();
  (window.cancelAnimationFrame as jest.Mock).mockRestore();
});

const getLineProps = () => mockLine.mock.calls[mockLine.mock.calls.length - 1][0];

describe("Chart — options", () => {
  it("disables animation", () => {
    mount(
      <Chart
        authoredState={baseAuthoredState}
        activeColumns={makeCols(["a"])}
        cols={["a"]}
        rows={[[1], [2]]}
        updatedAt={1}
        recordingEpoch={1}
      />
    );
    expect(getLineProps().options.animation).toBe(false);
  });

  it("uses linear x-scale when xAxisColumn is set", () => {
    mount(
      <Chart
        authoredState={{ ...baseAuthoredState, xAxisColumn: "time" }}
        activeColumns={makeCols(["a"])}
        cols={["time", "a"]}
        rows={[[0, 1], [1, 2]]}
        updatedAt={1}
        recordingEpoch={1}
      />
    );
    const props = getLineProps();
    expect(props.options.scales.x.type).toBe("linear");
    expect(props.options.parsing).toBe(false);
    expect(props.data.datasets[0].data).toEqual([
      { x: 0, y: 1 },
      { x: 1, y: 2 },
    ]);
  });

  it("uses category x-scale when xAxisColumn is blank", () => {
    mount(
      <Chart
        authoredState={baseAuthoredState}
        activeColumns={makeCols(["a"])}
        cols={["a"]}
        rows={[[1], [2], [3]]}
        updatedAt={1}
        recordingEpoch={1}
      />
    );
    const props = getLineProps();
    expect(props.options.scales.x.type).toBe("category");
    expect(props.data.labels).toEqual(["0", "1", "2"]);
    expect(props.data.datasets[0].data).toEqual([1, 2, 3]);
  });

  it("does not render legend (HTML legend renders in Step 5)", () => {
    mount(
      <Chart
        authoredState={baseAuthoredState}
        activeColumns={makeCols(["a"])}
        cols={["a"]}
        rows={[[1]]}
        updatedAt={1}
        recordingEpoch={1}
      />
    );
    expect(getLineProps().options.plugins.legend.display).toBe(false);
  });
});

describe("computeAxisBounds", () => {
  it("uses xMin=0 and xMax=authored||1 for zero rows", () => {
    expect(computeAxisBounds([], null, undefined)).toEqual({
      xMin: 0,
      xMax: 1,
      maxFiniteX: null,
    });
    expect(computeAxisBounds([], null, 50)).toEqual({
      xMin: 0,
      xMax: 50,
      maxFiniteX: null,
    });
  });

  it("uses min/max of finite x values for xAxis-column mode", () => {
    const rows: (number | null)[][] = [[5, 0], [3, 0], [1, 0], [4, 0], [9, 0]];
    const bounds = computeAxisBounds(rows, 0, undefined);
    expect(bounds.xMin).toBe(1);
    expect(bounds.xMax).toBe(9);
    expect(bounds.maxFiniteX).toBe(9);
  });

  it("uses authored max when higher than maxFiniteX", () => {
    const rows: (number | null)[][] = [[5, 0]];
    const bounds = computeAxisBounds(rows, 0, 100);
    expect(bounds.xMax).toBe(100);
  });

  it("uses maxFiniteX when higher than authored max (auto-compress)", () => {
    const rows: (number | null)[][] = [[50, 0], [100, 0], [150, 0]];
    const bounds = computeAxisBounds(rows, 0, 100);
    expect(bounds.xMax).toBe(150);
  });

  it("skips null/NaN x values when computing bounds", () => {
    const rows: (number | null)[][] = [
      [null, 0],
      [NaN as any, 0],
      [3, 0],
      [1, 0],
      [5, 0],
    ];
    const bounds = computeAxisBounds(rows, 0, undefined);
    expect(bounds.xMin).toBe(1);
    expect(bounds.xMax).toBe(5);
  });

  it("falls back to zero-rows behavior when all x values are null", () => {
    const rows: (number | null)[][] = [[null], [null], [null]];
    const bounds = computeAxisBounds(rows, 0, undefined);
    expect(bounds.xMin).toBe(0);
    expect(bounds.xMax).toBe(1);
    expect(bounds.maxFiniteX).toBeNull();
  });

  it("pads xMax when single-row dataset has xMin === xMax", () => {
    const bounds = computeAxisBounds([[5]], 0, undefined);
    expect(bounds.xMin).toBe(5);
    expect(bounds.xMax).toBeGreaterThan(5);
  });

  it("pads xMax when all rows have the same x value", () => {
    const rows: (number | null)[][] = [[5], [5], [5]];
    const bounds = computeAxisBounds(rows, 0, undefined);
    expect(bounds.xMin).toBe(5);
    expect(bounds.xMax).toBeGreaterThan(5);
  });

  it("handles adversarial strictly-decreasing x values", () => {
    const rows: (number | null)[][] = [[5], [4], [3], [2], [1]];
    const bounds = computeAxisBounds(rows, 0, undefined);
    expect(bounds.xMin).toBe(1);
    expect(bounds.xMax).toBeGreaterThanOrEqual(5);
  });

  it("handles non-monotonic x values", () => {
    const rows: (number | null)[][] = [[3], [1], [4], [1], [5], [9]];
    const bounds = computeAxisBounds(rows, 0, undefined);
    expect(bounds.xMin).toBe(1);
    expect(bounds.xMax).toBe(9);
  });

  it("row-index mode — uses rows.length-1 for xMax", () => {
    const bounds = computeAxisBounds([[1], [2], [3], [4]], null, undefined);
    expect(bounds.xMin).toBe(0);
    expect(bounds.xMax).toBe(3);
  });

  it("row-index mode — honors authored max when higher", () => {
    const bounds = computeAxisBounds([[1], [2]], null, 10);
    expect(bounds.xMax).toBe(10);
  });

  it("row-index mode — auto-compresses past authored max", () => {
    const bounds = computeAxisBounds(
      Array.from({ length: 10 }, () => [0]),
      null,
      5
    );
    expect(bounds.xMax).toBe(9);
  });
});

describe("Chart — non-finite x-point omission", () => {
  it("omits rows with null/NaN x values from the dataset in xAxisColumn mode", () => {
    mount(
      <Chart
        authoredState={{ ...baseAuthoredState, xAxisColumn: "time" }}
        activeColumns={makeCols(["a"])}
        cols={["time", "a"]}
        rows={[
          [null, 1],
          [NaN as any, 2],
          [3, 30],
          [4, 40],
        ]}
        updatedAt={1}
        recordingEpoch={1}
      />
    );
    const props = getLineProps();
    expect(props.data.datasets[0].data).toEqual([
      { x: 3, y: 30 },
      { x: 4, y: 40 },
    ]);
  });
});

describe("Chart — empty rows (chrome-only)", () => {
  it("omits category-scale min/max when rows is empty to avoid nonsensical axis labels", () => {
    mount(
      <Chart
        authoredState={baseAuthoredState}
        activeColumns={makeCols(["a"])}
        cols={["a"]}
        rows={[]}
        updatedAt={1}
        recordingEpoch={1}
      />
    );
    const props = getLineProps();
    // Category mode with no rows: min/max should be omitted so Chart.js auto-fits.
    expect(props.options.scales.x.min).toBeUndefined();
    expect(props.options.scales.x.max).toBeUndefined();
  });

  it("does not fire x-axis-compressed when rows is empty", () => {
    const onCompressed = jest.fn();
    mount(
      <Chart
        authoredState={{ ...baseAuthoredState, xAxisMax: 5 }}
        activeColumns={makeCols(["a"])}
        cols={["a"]}
        rows={[]}
        updatedAt={1}
        recordingEpoch={1}
        onXAxisCompressed={onCompressed}
      />
    );
    expect(onCompressed).not.toHaveBeenCalled();
  });
});

describe("Chart — auto-compress", () => {
  it("fires exactly once on false → true transition (row-index mode)", () => {
    jest.useFakeTimers();
    const onCompressed = jest.fn();
    const wrapper = mount(
      <Chart
        authoredState={{ ...baseAuthoredState, xAxisMax: 5 }}
        activeColumns={makeCols(["a"])}
        cols={["a"]}
        rows={Array.from({ length: 4 }, () => [0])}
        updatedAt={1}
        recordingEpoch={1}
        onXAxisCompressed={onCompressed}
      />
    );
    expect(onCompressed).not.toHaveBeenCalled();

    // Exceed the authored max
    wrapper.setProps({
      rows: Array.from({ length: 10 }, () => [0]),
      updatedAt: 2,
    });
    act(() => {
      jest.runAllTimers();
    });
    expect(onCompressed).toHaveBeenCalledTimes(1);

    // Further ticks do not re-fire
    wrapper.setProps({
      rows: Array.from({ length: 20 }, () => [0]),
      updatedAt: 3,
    });
    act(() => {
      jest.runAllTimers();
    });
    expect(onCompressed).toHaveBeenCalledTimes(1);
    jest.useRealTimers();
  });

  it("resets on new recording-started (epoch change) and fires again", () => {
    jest.useFakeTimers();
    const onCompressed = jest.fn();
    const wrapper = mount(
      <Chart
        authoredState={{ ...baseAuthoredState, xAxisMax: 5 }}
        activeColumns={makeCols(["a"])}
        cols={["a"]}
        rows={Array.from({ length: 10 }, () => [0])}
        updatedAt={1}
        recordingEpoch={1}
        onXAxisCompressed={onCompressed}
      />
    );
    act(() => {
      jest.runAllTimers();
    });
    expect(onCompressed).toHaveBeenCalledTimes(1);

    // New recording — epoch bumps, rows cleared
    wrapper.setProps({ rows: [], updatedAt: 2, recordingEpoch: 2 });
    act(() => {
      jest.runAllTimers();
    });
    // Rebuild exceeds authored max again
    wrapper.setProps({
      rows: Array.from({ length: 10 }, () => [0]),
      updatedAt: 3,
      recordingEpoch: 2,
    });
    act(() => {
      jest.runAllTimers();
    });
    expect(onCompressed).toHaveBeenCalledTimes(2);
    jest.useRealTimers();
  });

  it("does not fire when xAxisMax is undefined", () => {
    const onCompressed = jest.fn();
    mount(
      <Chart
        authoredState={baseAuthoredState}
        activeColumns={makeCols(["a"])}
        cols={["a"]}
        rows={Array.from({ length: 100 }, () => [0])}
        updatedAt={1}
        recordingEpoch={1}
        onXAxisCompressed={onCompressed}
      />
    );
    expect(onCompressed).not.toHaveBeenCalled();
  });
});

describe("Chart — rAF throttling and unmount safety", () => {
  it("does not crash when unmounted with pending frame", () => {
    jest.useFakeTimers();
    const wrapper = mount(
      <Chart
        authoredState={baseAuthoredState}
        activeColumns={makeCols(["a"])}
        cols={["a"]}
        rows={[[1]]}
        updatedAt={1}
        recordingEpoch={1}
      />
    );
    // bump updatedAt → schedules rAF
    wrapper.setProps({ updatedAt: 2 });
    wrapper.unmount();
    expect(() => jest.runAllTimers()).not.toThrow();
    jest.useRealTimers();
  });
});
