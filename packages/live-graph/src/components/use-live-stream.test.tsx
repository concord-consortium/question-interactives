import React from "react";
import { act } from "react-dom/test-utils";
import { mount, ReactWrapper } from "enzyme";
import { useLiveStream, ILiveStreamResult } from "./use-live-stream";
import { IAuthoredState } from "./types";
import * as api from "@concord-consortium/lara-interactive-api";
import * as parseFilterModule from "./parse-column-filter";
import * as parseDisplayNamesModule from "./parse-column-display-names";

jest.mock("@concord-consortium/lara-interactive-api");
jest.mock("@concord-consortium/object-storage", () => ({
  useObjectStorage: () => ({
    readMetadata: jest.fn(),
    readDataItem: jest.fn(),
  }),
}));

const mockApi = api as any;

interface HarnessProps {
  authoredState: IAuthoredState;
  linkedInteractiveId: string | undefined;
}

let lastResult: ILiveStreamResult | undefined;
const Harness: React.FC<HarnessProps> = ({ authoredState, linkedInteractiveId }) => {
  lastResult = useLiveStream(authoredState, linkedInteractiveId);
  return <div />;
};

const baseAuthoredState: IAuthoredState = {
  version: 1,
  questionType: "iframe_interactive",
  dataSourceInteractive: "interactive_1",
};

const emit = (message: any) => {
  act(() => {
    mockApi.__emitMessage(message);
  });
};

describe("useLiveStream — ID normalization and source lock", () => {
  beforeEach(() => {
    mockApi.__resetMockChannels();
    lastResult = undefined;
  });

  it.each([
    ["undefined", undefined],
    ["null", null],
    ["empty string", ""],
    ["whitespace-only string", "   "],
    ['"none" sentinel', "none"],
  ])("produces no-source and never subscribes when id is %s", (_label, id) => {
    mount(
      <Harness
        authoredState={baseAuthoredState}
        linkedInteractiveId={id as any}
      />
    );
    expect(lastResult?.viewState).toBe("no-source");
    expect(mockApi.createPubSubChannel).not.toHaveBeenCalled();
  });

  it("locks the source ID at first render — prop changes do not trigger resubscription", () => {
    const wrapper = mount(
      <Harness authoredState={baseAuthoredState} linkedInteractiveId="a" />
    );
    expect(mockApi.createPubSubChannel).toHaveBeenCalledTimes(1);
    expect(mockApi.createPubSubChannel).toHaveBeenCalledWith("a");

    wrapper.setProps({ linkedInteractiveId: "b" });

    expect(mockApi.createPubSubChannel).toHaveBeenCalledTimes(1);
    expect(mockApi.__getMockChannel("a")?.disposed).toBe(false);
  });

  it("disposes the channel on unmount", () => {
    const wrapper = mount(
      <Harness authoredState={baseAuthoredState} linkedInteractiveId="a" />
    );
    wrapper.unmount();
    expect(mockApi.__getMockChannel("a")?.disposed).toBe(true);
  });
});

describe("useLiveStream — viewState transitions", () => {
  let wrapper: ReactWrapper;

  beforeEach(() => {
    mockApi.__resetMockChannels();
    lastResult = undefined;
  });

  afterEach(() => {
    wrapper?.unmount();
  });

  it("starts in 'waiting' when a valid source is linked and no messages received", () => {
    wrapper = mount(
      <Harness authoredState={baseAuthoredState} linkedInteractiveId="interactive_1" />
    );
    expect(lastResult?.viewState).toBe("waiting");
  });

  it("moves to 'plotting' on recording-started with empty ticks (chrome-only)", () => {
    wrapper = mount(
      <Harness authoredState={baseAuthoredState} linkedInteractiveId="interactive_1" />
    );
    emit({ topic: "recording-started", cols: ["a", "b"] });
    expect(lastResult?.viewState).toBe("plotting");
    expect(lastResult?.rows.length).toBe(0);
  });

  it("discards ticks received before any recording-started", () => {
    wrapper = mount(
      <Harness authoredState={baseAuthoredState} linkedInteractiveId="interactive_1" />
    );
    emit({ topic: "recording-tick", values: { a: 1 } });
    expect(lastResult?.rows.length).toBe(0);
    expect(lastResult?.viewState).toBe("waiting");
  });

  it("accumulates ticks during plotting", () => {
    wrapper = mount(
      <Harness authoredState={baseAuthoredState} linkedInteractiveId="interactive_1" />
    );
    emit({ topic: "recording-started", cols: ["a", "b"] });
    emit({ topic: "recording-tick", values: { a: 1, b: 2 } });
    emit({ topic: "recording-tick", values: { a: 3, b: 4 } });
    expect(lastResult?.rows).toEqual([
      [1, 2],
      [3, 4],
    ]);
    expect(lastResult?.viewState).toBe("plotting");
  });

  it("retains data on recording-stopped and sets activityState to stopped", () => {
    wrapper = mount(
      <Harness authoredState={baseAuthoredState} linkedInteractiveId="interactive_1" />
    );
    emit({ topic: "recording-started", cols: ["a"] });
    emit({ topic: "recording-tick", values: { a: 1 } });
    emit({ topic: "recording-stopped" });
    expect(lastResult?.viewState).toBe("plotting");
    expect(lastResult?.activityState).toBe("stopped");
    expect(lastResult?.rows).toEqual([[1]]);
    expect(lastResult?.cols).toEqual(["a"]);
  });

  it("retains data after recording-stopped and accepts ticks from a new source", () => {
    wrapper = mount(
      <Harness authoredState={baseAuthoredState} linkedInteractiveId="interactive_1" />
    );
    emit({ topic: "recording-started", cols: ["a"] });
    emit({ topic: "recording-tick", values: { a: 1 } });
    emit({ topic: "recording-stopped" });
    expect(lastResult?.activityState).toBe("stopped");
    emit({ topic: "recording-started", cols: ["a", "b"] });
    expect(lastResult?.viewState).toBe("plotting");
    expect(lastResult?.activityState).toBe("recording");
    expect(lastResult?.rows.length).toBe(0);
  });

  it("clears on repeated recording-started (double-started)", () => {
    wrapper = mount(
      <Harness authoredState={baseAuthoredState} linkedInteractiveId="interactive_1" />
    );
    emit({ topic: "recording-started", cols: ["a"] });
    emit({ topic: "recording-tick", values: { a: 1 } });
    emit({ topic: "recording-started", cols: ["a"] });
    expect(lastResult?.rows.length).toBe(0);
  });
});

describe("useLiveStream — x-axis-missing viewState and recovery", () => {
  let wrapper: ReactWrapper;

  beforeEach(() => {
    mockApi.__resetMockChannels();
    lastResult = undefined;
  });

  afterEach(() => {
    wrapper?.unmount();
  });

  it("enters x-axis-missing when authored column is not in cols", () => {
    wrapper = mount(
      <Harness
        authoredState={{ ...baseAuthoredState, xAxisColumn: "time" }}
        linkedInteractiveId="interactive_1"
      />
    );
    emit({ topic: "recording-started", cols: ["a", "b"] });
    expect(lastResult?.viewState).toBe("x-axis-missing");
  });

  it("discards ticks while in x-axis-missing (dataset does not grow)", () => {
    wrapper = mount(
      <Harness
        authoredState={{ ...baseAuthoredState, xAxisColumn: "time" }}
        linkedInteractiveId="interactive_1"
      />
    );
    emit({ topic: "recording-started", cols: ["a"] });
    for (let i = 0; i < 5; i++) {
      emit({ topic: "recording-tick", values: { a: i } });
    }
    expect(lastResult?.rows.length).toBe(0);
  });

  it("recovers from x-axis-missing when a new recording-started includes the column", () => {
    wrapper = mount(
      <Harness
        authoredState={{ ...baseAuthoredState, xAxisColumn: "time" }}
        linkedInteractiveId="interactive_1"
      />
    );
    emit({ topic: "recording-started", cols: ["a"] });
    expect(lastResult?.viewState).toBe("x-axis-missing");
    emit({ topic: "recording-started", cols: ["time", "a"] });
    expect(lastResult?.viewState).toBe("plotting");
    emit({ topic: "recording-tick", values: { time: 1, a: 2 } });
    expect(lastResult?.rows).toEqual([[1, 2]]);
  });
});

describe("useLiveStream — filter-empty viewState and recovery", () => {
  let wrapper: ReactWrapper;

  beforeEach(() => {
    mockApi.__resetMockChannels();
    lastResult = undefined;
  });

  afterEach(() => {
    wrapper?.unmount();
  });

  it("enters filter-empty when allow list excludes every column", () => {
    wrapper = mount(
      <Harness
        authoredState={{
          ...baseAuthoredState,
          columnFilteringMode: "allow",
          allowList: "zzz",
        }}
        linkedInteractiveId="interactive_1"
      />
    );
    emit({ topic: "recording-started", cols: ["a", "b"] });
    expect(lastResult?.viewState).toBe("filter-empty");
  });

  it("recovers from filter-empty when a new recording-started includes allowed columns", () => {
    wrapper = mount(
      <Harness
        authoredState={{
          ...baseAuthoredState,
          columnFilteringMode: "allow",
          allowList: "target",
        }}
        linkedInteractiveId="interactive_1"
      />
    );
    emit({ topic: "recording-started", cols: ["a"] });
    expect(lastResult?.viewState).toBe("filter-empty");
    emit({ topic: "recording-started", cols: ["target", "a"] });
    expect(lastResult?.viewState).toBe("plotting");
  });
});

describe("useLiveStream — active-column derivation", () => {
  let wrapper: ReactWrapper;

  beforeEach(() => {
    mockApi.__resetMockChannels();
    lastResult = undefined;
  });

  afterEach(() => {
    wrapper?.unmount();
  });

  it("always excludes the x-axis column from active columns, even if in allow list", () => {
    wrapper = mount(
      <Harness
        authoredState={{
          ...baseAuthoredState,
          xAxisColumn: "time",
          columnFilteringMode: "allow",
          allowList: "time, predators, prey",
        }}
        linkedInteractiveId="interactive_1"
      />
    );
    emit({ topic: "recording-started", cols: ["time", "predators", "prey"] });
    expect(lastResult?.activeColumns.map(c => c.column)).toEqual([
      "predators",
      "prey",
    ]);
  });

  it("defaults columnFilteringMode to 'all' when undefined", () => {
    wrapper = mount(
      <Harness
        authoredState={{ ...baseAuthoredState, columnFilteringMode: undefined }}
        linkedInteractiveId="interactive_1"
      />
    );
    emit({ topic: "recording-started", cols: ["a", "b"] });
    expect(lastResult?.activeColumns.map(c => c.column)).toEqual(["a", "b"]);
  });

  it("applies display-name mapping", () => {
    wrapper = mount(
      <Harness
        authoredState={{
          ...baseAuthoredState,
          columnDisplayNames: "pred=Predators\nprey=Prey",
        }}
        linkedInteractiveId="interactive_1"
      />
    );
    emit({ topic: "recording-started", cols: ["pred", "prey", "other"] });
    expect(lastResult?.activeColumns).toEqual([
      { column: "pred", label: "Predators" },
      { column: "prey", label: "Prey" },
      { column: "other", label: "other" },
    ]);
  });
});

describe("useLiveStream — tick payload coercion", () => {
  let wrapper: ReactWrapper;

  beforeEach(() => {
    mockApi.__resetMockChannels();
    lastResult = undefined;
  });

  afterEach(() => {
    wrapper?.unmount();
  });

  it("produces null when a declared column is missing from values", () => {
    wrapper = mount(
      <Harness authoredState={baseAuthoredState} linkedInteractiveId="interactive_1" />
    );
    emit({ topic: "recording-started", cols: ["a", "b"] });
    emit({ topic: "recording-tick", values: { a: 1 } });
    expect(lastResult?.rows).toEqual([[1, null]]);
  });

  it("silently ignores keys not declared in cols", () => {
    wrapper = mount(
      <Harness authoredState={baseAuthoredState} linkedInteractiveId="interactive_1" />
    );
    emit({ topic: "recording-started", cols: ["a"] });
    emit({ topic: "recording-tick", values: { a: 1, extra: 99 } });
    expect(lastResult?.rows).toEqual([[1]]);
  });

  it("coerces string values via parseFloat", () => {
    wrapper = mount(
      <Harness authoredState={baseAuthoredState} linkedInteractiveId="interactive_1" />
    );
    emit({ topic: "recording-started", cols: ["a"] });
    emit({ topic: "recording-tick", values: { a: "3.14" } });
    expect(lastResult?.rows).toEqual([[3.14]]);
  });

  it("returns null for unparsable strings", () => {
    wrapper = mount(
      <Harness authoredState={baseAuthoredState} linkedInteractiveId="interactive_1" />
    );
    emit({ topic: "recording-started", cols: ["a"] });
    emit({ topic: "recording-tick", values: { a: "n/a" } });
    expect(lastResult?.rows).toEqual([[null]]);
  });

  it.each([
    ["NaN", NaN],
    ["Infinity", Infinity],
    ["-Infinity", -Infinity],
  ])("returns null for %s", (_label, value) => {
    wrapper = mount(
      <Harness authoredState={baseAuthoredState} linkedInteractiveId="interactive_1" />
    );
    emit({ topic: "recording-started", cols: ["a"] });
    emit({ topic: "recording-tick", values: { a: value } });
    expect(lastResult?.rows).toEqual([[null]]);
  });

  it("returns null for '1e309' (parses to Infinity)", () => {
    wrapper = mount(
      <Harness authoredState={baseAuthoredState} linkedInteractiveId="interactive_1" />
    );
    emit({ topic: "recording-started", cols: ["a"] });
    emit({ topic: "recording-tick", values: { a: "1e309" } });
    expect(lastResult?.rows).toEqual([[null]]);
  });

  it.each([
    ["boolean true", true],
    ["boolean false", false],
    ["explicit null", null],
    ["plain object", {}],
    ["array", [1]],
  ])("returns null for %s", (_label, value) => {
    wrapper = mount(
      <Harness authoredState={baseAuthoredState} linkedInteractiveId="interactive_1" />
    );
    emit({ topic: "recording-started", cols: ["a"] });
    emit({ topic: "recording-tick", values: { a: value } });
    expect(lastResult?.rows).toEqual([[null]]);
  });
});

describe("useLiveStream — recordingEpoch", () => {
  let wrapper: ReactWrapper;

  beforeEach(() => {
    mockApi.__resetMockChannels();
    lastResult = undefined;
  });

  afterEach(() => {
    wrapper?.unmount();
  });

  it("starts at 0, increments only on recording-started, and ignores ticks", () => {
    wrapper = mount(
      <Harness authoredState={baseAuthoredState} linkedInteractiveId="interactive_1" />
    );
    expect(lastResult?.recordingEpoch).toBe(0);

    emit({ topic: "recording-started", cols: ["a"] });
    expect(lastResult?.recordingEpoch).toBe(1);

    emit({ topic: "recording-tick", values: { a: 1 } });
    emit({ topic: "recording-tick", values: { a: 2 } });
    expect(lastResult?.recordingEpoch).toBe(1);

    emit({ topic: "recording-started", cols: ["a"] });
    expect(lastResult?.recordingEpoch).toBe(2);
  });
});

describe("useLiveStream — post-stop behavior", () => {
  let wrapper: ReactWrapper;

  beforeEach(() => {
    mockApi.__resetMockChannels();
    lastResult = undefined;
  });

  afterEach(() => {
    wrapper?.unmount();
  });

  it("retains chart data after recording-stopped with activityState stopped", () => {
    wrapper = mount(
      <Harness authoredState={baseAuthoredState} linkedInteractiveId="interactive_1" />
    );
    emit({ topic: "recording-started", cols: ["a"] });
    emit({ topic: "recording-tick", values: { a: 1 } });
    emit({ topic: "recording-tick", values: { a: 2 } });
    emit({ topic: "recording-stopped" });
    expect(lastResult?.viewState).toBe("plotting");
    expect(lastResult?.activityState).toBe("stopped");
    expect(lastResult?.cols).toEqual(["a"]);
    expect(lastResult?.rows).toEqual([[1], [2]]);
  });
});

describe("useLiveStream — parser memoization", () => {
  let wrapper: ReactWrapper;

  beforeEach(() => {
    mockApi.__resetMockChannels();
    lastResult = undefined;
  });

  afterEach(() => {
    wrapper?.unmount();
  });

  it("invokes parsers at most once per raw-string change across a tick burst (recording)", () => {
    const displaySpy = jest.spyOn(parseDisplayNamesModule, "parseColumnDisplayNames");
    const filterSpy = jest.spyOn(parseFilterModule, "parseColumnFilter");
    displaySpy.mockClear();
    filterSpy.mockClear();

    wrapper = mount(
      <Harness
        authoredState={{
          ...baseAuthoredState,
          columnDisplayNames: "a=A",
          allowList: "a",
          columnFilteringMode: "allow",
        }}
        linkedInteractiveId="interactive_1"
      />
    );
    const displayCallsAfterMount = displaySpy.mock.calls.length;
    const filterCallsAfterMount = filterSpy.mock.calls.length;

    emit({ topic: "recording-started", cols: ["a", "b"] });
    for (let i = 0; i < 20; i++) {
      emit({ topic: "recording-tick", values: { a: i } });
    }

    expect(displaySpy.mock.calls.length).toBe(displayCallsAfterMount);
    expect(filterSpy.mock.calls.length).toBe(filterCallsAfterMount);

    displaySpy.mockRestore();
    filterSpy.mockRestore();
  });
});

describe("useLiveStream — simulation message handling", () => {
  let wrapper: ReactWrapper;

  beforeEach(() => {
    mockApi.__resetMockChannels();
    lastResult = undefined;
  });

  afterEach(() => {
    wrapper?.unmount();
  });

  it("handles simulation-started like recording-started", () => {
    wrapper = mount(
      <Harness authoredState={baseAuthoredState} linkedInteractiveId="interactive_1" />
    );
    emit({ topic: "simulation-started", cols: ["a", "b"], title: "Test Model" });
    expect(lastResult?.viewState).toBe("plotting");
    expect(lastResult?.activityState).toBe("playing");
    expect(lastResult?.sourceTitle).toBe("Test Model");
    expect(lastResult?.cols).toEqual(["a", "b"]);
  });

  it("handles simulation-tick like recording-tick", () => {
    wrapper = mount(
      <Harness authoredState={baseAuthoredState} linkedInteractiveId="interactive_1" />
    );
    emit({ topic: "simulation-started", cols: ["a", "b"] });
    emit({ topic: "simulation-tick", values: { a: 1, b: 2 } });
    emit({ topic: "simulation-tick", values: { a: 3, b: 4 } });
    expect(lastResult?.rows).toEqual([[1, 2], [3, 4]]);
  });

  it("simulation-paused retains data and sets activityState to paused", () => {
    wrapper = mount(
      <Harness authoredState={baseAuthoredState} linkedInteractiveId="interactive_1" />
    );
    emit({ topic: "simulation-started", cols: ["a"] });
    emit({ topic: "simulation-tick", values: { a: 1 } });
    emit({ topic: "simulation-paused" });
    expect(lastResult?.viewState).toBe("plotting");
    expect(lastResult?.activityState).toBe("paused");
    expect(lastResult?.rows).toEqual([[1]]);
  });

  it("simulation-reset clears data and returns to waiting", () => {
    wrapper = mount(
      <Harness authoredState={baseAuthoredState} linkedInteractiveId="interactive_1" />
    );
    emit({ topic: "simulation-started", cols: ["a"] });
    emit({ topic: "simulation-tick", values: { a: 1 } });
    emit({ topic: "simulation-reset" });
    expect(lastResult?.viewState).toBe("waiting");
    expect(lastResult?.activityState).toBe("idle");
    expect(lastResult?.cols).toBeNull();
    expect(lastResult?.rows.length).toBe(0);
  });

  it("ticks resume after pause (activityState returns to playing)", () => {
    wrapper = mount(
      <Harness authoredState={baseAuthoredState} linkedInteractiveId="interactive_1" />
    );
    emit({ topic: "simulation-started", cols: ["a"] });
    emit({ topic: "simulation-tick", values: { a: 1 } });
    emit({ topic: "simulation-paused" });
    expect(lastResult?.activityState).toBe("paused");
    emit({ topic: "simulation-tick", values: { a: 2 } });
    expect(lastResult?.activityState).toBe("playing");
    expect(lastResult?.rows).toEqual([[1], [2]]);
  });

  it("recording-started resets chart during active simulation (mutual exclusivity)", () => {
    wrapper = mount(
      <Harness authoredState={baseAuthoredState} linkedInteractiveId="interactive_1" />
    );
    emit({ topic: "simulation-started", cols: ["a"] });
    emit({ topic: "simulation-tick", values: { a: 1 } });
    expect(lastResult?.activityState).toBe("playing");
    emit({ topic: "recording-started", cols: ["x", "y"] });
    expect(lastResult?.activityState).toBe("recording");
    expect(lastResult?.cols).toEqual(["x", "y"]);
    expect(lastResult?.rows.length).toBe(0);
  });
});

describe("useLiveStream — activity state and source title", () => {
  let wrapper: ReactWrapper;

  beforeEach(() => {
    mockApi.__resetMockChannels();
    lastResult = undefined;
  });

  afterEach(() => {
    wrapper?.unmount();
  });

  it("starts with idle activityState and empty sourceTitle", () => {
    wrapper = mount(
      <Harness authoredState={baseAuthoredState} linkedInteractiveId="interactive_1" />
    );
    expect(lastResult?.activityState).toBe("idle");
    expect(lastResult?.sourceTitle).toBe("");
  });

  it("recording-started sets recording activityState", () => {
    wrapper = mount(
      <Harness authoredState={baseAuthoredState} linkedInteractiveId="interactive_1" />
    );
    emit({ topic: "recording-started", cols: ["a"], title: "My Model" });
    expect(lastResult?.activityState).toBe("recording");
    expect(lastResult?.sourceTitle).toBe("My Model");
  });

  it("title defaults to empty string when not provided", () => {
    wrapper = mount(
      <Harness authoredState={baseAuthoredState} linkedInteractiveId="interactive_1" />
    );
    emit({ topic: "recording-started", cols: ["a"] });
    expect(lastResult?.sourceTitle).toBe("");
  });

  it("recording-deselected clears data and returns to waiting", () => {
    wrapper = mount(
      <Harness authoredState={baseAuthoredState} linkedInteractiveId="interactive_1" />
    );
    emit({ topic: "recording-started", cols: ["a"] });
    emit({ topic: "recording-tick", values: { a: 1 } });
    emit({ topic: "recording-deselected" });
    expect(lastResult?.viewState).toBe("waiting");
    expect(lastResult?.activityState).toBe("idle");
    expect(lastResult?.cols).toBeNull();
    expect(lastResult?.rows.length).toBe(0);
  });
});

describe("useLiveStream — recording-selected status handling", () => {
  let wrapper: ReactWrapper;

  beforeEach(() => {
    mockApi.__resetMockChannels();
    lastResult = undefined;
  });

  afterEach(() => {
    wrapper?.unmount();
  });

  it("recording-selected with status 'empty' clears data and shows status message", () => {
    wrapper = mount(
      <Harness authoredState={baseAuthoredState} linkedInteractiveId="interactive_1" />
    );
    emit({ topic: "simulation-started", cols: ["a"] });
    emit({ topic: "simulation-tick", values: { a: 1 } });
    emit({ topic: "recording-selected", objectId: null, title: "Model 1", status: "empty" });
    expect(lastResult?.viewState).toBe("waiting");
    expect(lastResult?.activityState).toBe("recorded");
    expect(lastResult?.sourceTitle).toBe("Model 1");
    expect(lastResult?.statusMessage).toBe("No recording data yet.");
    expect(lastResult?.cols).toBeNull();
    expect(lastResult?.rows.length).toBe(0);
  });

  it("recording-selected with status 'waiting' clears data and shows saving message", () => {
    wrapper = mount(
      <Harness authoredState={baseAuthoredState} linkedInteractiveId="interactive_1" />
    );
    emit({ topic: "recording-selected", objectId: null, title: "Model 1: 10:32 AM (2 secs)", status: "waiting" });
    expect(lastResult?.viewState).toBe("waiting");
    expect(lastResult?.activityState).toBe("recorded");
    expect(lastResult?.statusMessage).toBe("Saving recording...");
  });

  it("recording-selected with status 'ready' clears data and shows loading message", () => {
    wrapper = mount(
      <Harness authoredState={baseAuthoredState} linkedInteractiveId="interactive_1" />
    );
    emit({ topic: "recording-selected", objectId: "obj-123", title: "Model 1: 10:32 AM (2 secs)", status: "ready" });
    expect(lastResult?.viewState).toBe("waiting");
    expect(lastResult?.activityState).toBe("recorded");
    expect(lastResult?.statusMessage).toBe("Loading recording...");
  });

  it("recording-selected with status 'failed' resets to idle and shows error message", () => {
    wrapper = mount(
      <Harness authoredState={baseAuthoredState} linkedInteractiveId="interactive_1" />
    );
    emit({ topic: "recording-selected", objectId: null, title: "Model 1", status: "failed" });
    expect(lastResult?.viewState).toBe("waiting");
    expect(lastResult?.activityState).toBe("idle");
    expect(lastResult?.sourceTitle).toBe("");
    expect(lastResult?.statusMessage).toBe("Recording data is not available yet.");
  });

  it("recording-selected cancels previous source (resets epoch)", () => {
    wrapper = mount(
      <Harness authoredState={baseAuthoredState} linkedInteractiveId="interactive_1" />
    );
    emit({ topic: "simulation-started", cols: ["a"] });
    emit({ topic: "simulation-tick", values: { a: 1 } });
    const epochBefore = lastResult?.recordingEpoch;
    emit({ topic: "recording-selected", objectId: null, title: "Model 1", status: "empty" });
    expect(lastResult?.recordingEpoch).toBe((epochBefore ?? 0) + 1);
    expect(lastResult?.rows.length).toBe(0);
  });
});
