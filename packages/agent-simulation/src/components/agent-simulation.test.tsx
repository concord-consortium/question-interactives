import React from "react";
import { render, screen, fireEvent, act } from "@testing-library/react";
import {
  addLinkedInteractiveStateListener,
  removeLinkedInteractiveStateListener,
  useInitMessage,
  createPubSubChannel
} from "@concord-consortium/lara-interactive-api";
import { AgentSimulationComponent } from "./agent-simulation";
import { IAuthoredState, IInteractiveState } from "./types";
import * as AA from "@gjmcn/atomic-agents";
import * as AV from "@concord-consortium/atomic-agents-vis";
import { useLinkedInteractiveId } from "@concord-consortium/question-interactives-helpers/src/hooks/use-linked-interactive-id";
import { AgentSimulation } from "../models/agent-simulation";
import { ObjectStorageConfig, ObjectStorageProvider, useObjectStorage } from "@concord-consortium/object-storage";
import { IWidgetProps } from "../types/widgets";

// Mock the dependencies
jest.mock("@concord-consortium/lara-interactive-api", () => ({
  addLinkedInteractiveStateListener: jest.fn(),
  removeLinkedInteractiveStateListener: jest.fn(),
  log: jest.fn(),
  useInitMessage: jest.fn(),
  createPubSubChannel: jest.fn(),
}));

jest.mock("@concord-consortium/object-storage", () => {
  const actual = jest.requireActual("@concord-consortium/object-storage");
  return {
    ...actual,
    useObjectStorage: jest.fn(actual.useObjectStorage),
  };
});

jest.mock("@concord-consortium/question-interactives-helpers/src/hooks/use-linked-interactive-id", () => ({
  useLinkedInteractiveId: jest.fn()
}));

jest.mock("../models/agent-simulation", () => ({
  AgentSimulation: jest.fn()
}));

const mockUseLinkedInteractiveId = useLinkedInteractiveId as jest.Mock;
const mockAddLinkedInteractiveStateListener = addLinkedInteractiveStateListener as jest.Mock;
const mockRemoveLinkedInteractiveStateListener = removeLinkedInteractiveStateListener as jest.Mock;
const mockUseInitMessage = useInitMessage as jest.Mock;
const mockCreatePubSubChannel = createPubSubChannel as jest.Mock;
const mockUseObjectStorage = useObjectStorage as jest.Mock;
const mockSimulationConstructor = AgentSimulation as jest.Mock;
const mockVis = AV.vis as jest.Mock;

describe("AgentSimulationComponent", () => {
  const mockSimulation = {
    pause: jest.fn(),
    end: jest.fn()
  };

  const mockGlobals = {
    getValue: jest.fn(),
    setValue: jest.fn(),
    get: jest.fn(),
    set: jest.fn(),
    values: jest.fn()
  };

  const mockAddWidget = jest.fn();

  const mockAgentSimulation: {
    addWidget: jest.Mock;
    destroy: jest.Mock;
    globals: typeof mockGlobals;
    sim: typeof mockSimulation;
    widgets: IWidgetProps[];
  } = {
    addWidget: mockAddWidget,
    destroy: jest.fn(),
    globals: mockGlobals,
    sim: mockSimulation,
    widgets: []
  };

  const defaultAuthoredState: IAuthoredState = {
    version: 1,
    questionType: "iframe_interactive",
    code: "// Default simulation code",
    gridHeight: 450,
    gridWidth: 450,
    gridStep: 15,
    maxRecordingTime: 90,
  };

  const defaultInteractiveState: IInteractiveState = {
    version: 1,
    answerType: "interactive_state",
    name: "Model 1",
    recordings: [],
  };

  const objectStorageConfig: ObjectStorageConfig = {
    version: 1,
    type: "demo",
  };

  const mockSetInteractiveState = jest.fn();
  const originalEval = global.eval;

  beforeEach(() => {
    jest.clearAllMocks();
    // Create fresh mock instances for each test
    mockSimulation.pause.mockClear();
    mockAgentSimulation.destroy.mockClear();
    mockGlobals.getValue.mockClear();
    mockGlobals.setValue.mockClear();
    mockAddWidget.mockClear();

    // Set up AgentSimulation mock to return an object with sim and other properties
    mockSimulationConstructor.mockReturnValue(mockAgentSimulation);

    mockUseLinkedInteractiveId.mockReturnValue(null);
    mockUseInitMessage.mockReturnValue({
      mode: "runtime",
      interactive: {
        id: "test-interactive-id"
      }
    });

    // Mock createPubSubChannel to return a mock channel
    const mockPubSubChannel = {
      publish: jest.fn(),
      subscribe: jest.fn(),
      unsubscribe: jest.fn()
    };
    mockCreatePubSubChannel.mockReturnValue(mockPubSubChannel);

    // Mock eval to return a simple function that doesn't throw
    const mockFunction = jest.fn();
    global.eval = jest.fn(() => mockFunction);
  });

  afterEach(() => {
    // Restore eval to its original value
    global.eval = originalEval;
  });

  it("renders basic simulation controls", () => {
    render(
      <ObjectStorageProvider config={objectStorageConfig}>
        <AgentSimulationComponent
          authoredState={defaultAuthoredState}
          interactiveState={defaultInteractiveState}
          setInteractiveState={mockSetInteractiveState}
        />
      </ObjectStorageProvider>
    );

    expect(screen.getByTestId("reset-button")).toBeInTheDocument();
    expect(screen.getByTestId("play-pause-button")).toBeInTheDocument();
  });

  it("creates simulation with correct parameters", async () => {
    render(
      <ObjectStorageProvider config={objectStorageConfig}>
        <AgentSimulationComponent
          authoredState={defaultAuthoredState}
          interactiveState={defaultInteractiveState}
          setInteractiveState={mockSetInteractiveState}
        />
      </ObjectStorageProvider>
    );

    expect(mockSimulationConstructor).toHaveBeenCalledWith(450, 450, 15, undefined);

    expect(mockVis).toHaveBeenCalledWith(mockAgentSimulation.sim, { speed: 1, target: expect.any(HTMLDivElement), preserveDrawingBuffer: true, afterTick: expect.any(Function) });

    // Wait for 10ms
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 10));
    });

    expect(mockSimulation.pause).toHaveBeenCalledWith(true);
  });

  it("displays error for invalid grid dimensions", () => {
    const invalidAuthoredState = {
      ...defaultAuthoredState,
      gridHeight: -1,
      gridWidth: 0,
      gridStep: 0
    };

    render(
      <ObjectStorageProvider config={objectStorageConfig}>
        <AgentSimulationComponent
          authoredState={invalidAuthoredState}
          interactiveState={defaultInteractiveState}
          setInteractiveState={mockSetInteractiveState}
        />
      </ObjectStorageProvider>
    );

    expect(screen.getByText("Grid height, width, and step must be positive integers.")).toBeInTheDocument();
  });

  it("displays error for non-divisible grid dimensions", () => {
    const invalidAuthoredState = {
      ...defaultAuthoredState,
      gridHeight: 451, // Not divisible by gridStep (15)
      gridWidth: 450
    };

    render(
      <ObjectStorageProvider config={objectStorageConfig}>
        <AgentSimulationComponent
          authoredState={invalidAuthoredState}
          interactiveState={defaultInteractiveState}
          setInteractiveState={mockSetInteractiveState}
        />
      </ObjectStorageProvider>
    );

    expect(screen.getByText("Grid height and width must be divisible by the grid step.")).toBeInTheDocument();
  });

  it("handles pause/play button clicks", async () => {
    render(
      <ObjectStorageProvider config={objectStorageConfig}>
        <AgentSimulationComponent
          authoredState={defaultAuthoredState}
          interactiveState={defaultInteractiveState}
          setInteractiveState={mockSetInteractiveState}
        />
      </ObjectStorageProvider>
    );

    const pausePlayButton = screen.getByTestId("play-pause-button");

    await screen.findByLabelText("Play");

    expect(pausePlayButton).toHaveAttribute("aria-label", "Play");
    expect(pausePlayButton).toHaveAttribute("title", "Play");

    fireEvent.click(pausePlayButton);
    expect(mockSimulation.pause).toHaveBeenCalledWith(false);
    expect(pausePlayButton).toHaveAttribute("aria-label", "Pause");
    expect(pausePlayButton).toHaveAttribute("title", "Pause");

    fireEvent.click(pausePlayButton);
    expect(mockSimulation.pause).toHaveBeenCalledWith(true);
    expect(pausePlayButton).toHaveAttribute("aria-label", "Play");
    expect(pausePlayButton).toHaveAttribute("title", "Play");
  });

  it("handles reset button click", () => {
    mockGlobals.values.mockReturnValue({});
    render(
      <ObjectStorageProvider config={objectStorageConfig}>
        <AgentSimulationComponent
          authoredState={defaultAuthoredState}
          interactiveState={defaultInteractiveState}
          setInteractiveState={mockSetInteractiveState}
        />
      </ObjectStorageProvider>
    );

    const initialCallCount = mockSimulationConstructor.mock.calls.length;

    // Reset button should be enabled initially to allow for resetting random setups prior to starting.
    const resetButton = screen.getByTestId("reset-button");
    expect(resetButton).not.toBeDisabled();

    // Click reset button
    fireEvent.click(resetButton);

    // Should create a new simulation instance
    expect(mockSimulationConstructor.mock.calls.length).toBeGreaterThan(initialCallCount);

    // Reset button should still be enabled after reset
    expect(resetButton).not.toBeDisabled();
  });

  it("shows blockly code toggle when blockly code exists", () => {
    const stateWithBlocklyCode: IInteractiveState = {
      ...defaultInteractiveState,
      blocklyCode: "// Blockly generated code"
    };

    render(
      <ObjectStorageProvider config={objectStorageConfig}>
        <AgentSimulationComponent
          authoredState={defaultAuthoredState}
          interactiveState={stateWithBlocklyCode}
          setInteractiveState={mockSetInteractiveState}
        />
      </ObjectStorageProvider>
    );

    expect(screen.getByText("Show Blockly Code")).toBeInTheDocument();

    fireEvent.click(screen.getByText("Show Blockly Code"));
    expect(screen.getByText("Hide Blockly Code")).toBeInTheDocument();
    expect(screen.getByText("// Blockly generated code")).toBeInTheDocument();
  });

  it("renders update code button when linked interactive is available", () => {
    mockUseLinkedInteractiveId.mockReturnValue("linked-interactive-id");

    render(
      <ObjectStorageProvider config={objectStorageConfig}>
        <AgentSimulationComponent
          authoredState={defaultAuthoredState}
          interactiveState={defaultInteractiveState}
          setInteractiveState={mockSetInteractiveState}
        />
      </ObjectStorageProvider>
    );

    const updateButton = screen.getByTestId("update-code-button");
    expect(updateButton).toBeInTheDocument();
    expect(updateButton).toBeDisabled(); // Should be disabled initially with no external code
  });

  it("handles linked interactive state updates", () => {
    mockUseLinkedInteractiveId.mockReturnValue("linked-interactive-id");

    render(
      <ObjectStorageProvider config={objectStorageConfig}>
        <AgentSimulationComponent
          authoredState={defaultAuthoredState}
          interactiveState={defaultInteractiveState}
          setInteractiveState={mockSetInteractiveState}
        />
      </ObjectStorageProvider>
    );

    // Verify listener was added
    expect(mockAddLinkedInteractiveStateListener).toHaveBeenCalled();

    // Simulate receiving new code from linked interactive
    const listenerCall = mockAddLinkedInteractiveStateListener.mock.calls[0];
    const listener = listenerCall[0];
    const newLinkedState = { code: "// New blockly code" };

    act(() => {
      listener(newLinkedState);
    });

    // Update button should now be enabled
    const updateButton = screen.getByTestId("update-code-button");
    expect(updateButton).not.toBeDisabled();
  });

  it("updates blockly code when update button is clicked", () => {
    mockGlobals.values.mockReturnValue({});
    mockUseLinkedInteractiveId.mockReturnValue("linked-interactive-id");

    render(
      <ObjectStorageProvider config={objectStorageConfig}>
        <AgentSimulationComponent
          authoredState={defaultAuthoredState}
          interactiveState={defaultInteractiveState}
          setInteractiveState={mockSetInteractiveState}
        />
      </ObjectStorageProvider>
    );

    // Simulate receiving new code from linked interactive
    const listenerCall = mockAddLinkedInteractiveStateListener.mock.calls[0];
    const listener = listenerCall[0];
    const newLinkedState = { code: "// Updated blockly code" };

    act(() => {
      listener(newLinkedState);
    });

    // Click update button
    fireEvent.click(screen.getByTestId("update-code-button"));

    // Should call setInteractiveState with new code
    expect(mockSetInteractiveState).toHaveBeenCalledWith(expect.any(Function));

    // Test the function passed to setInteractiveState
    const updateFunction = mockSetInteractiveState.mock.calls[0][0];
    const newState = updateFunction(defaultInteractiveState);

    expect(newState).toEqual({
      ...defaultInteractiveState,
      answerType: "interactive_state",
      version: 1,
      blocklyCode: "// Updated blockly code"
    });
  });

  it("disables Reset button after it is clicked when the simulation has been started, re-enables on code update.", () => {
    mockGlobals.values.mockReturnValue({});
    mockUseLinkedInteractiveId.mockReturnValue("linked-interactive-id");

    render(
      <ObjectStorageProvider config={objectStorageConfig}>
        <AgentSimulationComponent
          authoredState={defaultAuthoredState}
          interactiveState={{ ...defaultInteractiveState, blocklyCode: "// Initial code" }}
          setInteractiveState={mockSetInteractiveState}
        />
      </ObjectStorageProvider>
    );

    const resetButton = screen.getByTestId("reset-button");
    const playButton = screen.getByTestId("play-pause-button");

    // Initially, reset should be enabled
    expect(resetButton).not.toBeDisabled();

    fireEvent.click(playButton);
    expect(resetButton).not.toBeDisabled();

    fireEvent.click(resetButton);
    expect(resetButton).toBeDisabled();

    // Simulate receiving new code from linked interactive
    const listenerCall = mockAddLinkedInteractiveStateListener.mock.calls[0];
    const listener = listenerCall[0];
    const newLinkedState = { code: "// New code" };

    act(() => {
      listener(newLinkedState);
    });

    const updateButton = screen.getByTestId("update-code-button");
    expect(updateButton).not.toBeDisabled();
    fireEvent.click(updateButton);

    expect(resetButton).not.toBeDisabled();
  });

  it("can keep Play button enabled when Reset button is disabled", () => {
    mockGlobals.values.mockReturnValue({});
    mockUseLinkedInteractiveId.mockReturnValue("linked-interactive-id");

    render(
      <ObjectStorageProvider config={objectStorageConfig}>
        <AgentSimulationComponent
          authoredState={defaultAuthoredState}
          interactiveState={{ ...defaultInteractiveState, blocklyCode: "// Initial code" }}
          setInteractiveState={mockSetInteractiveState}
        />
      </ObjectStorageProvider>
    );

    const resetButton = screen.getByTestId("reset-button");
    const playButton = screen.getByTestId("play-pause-button");

    // Start the simulation
    fireEvent.click(playButton);

    // Click reset to disable it
    fireEvent.click(resetButton);

    // Reset should be disabled
    expect(resetButton).toBeDisabled();

    // But Play button should still be enabled
    expect(playButton).not.toBeDisabled();
  });

  it("handles simulation setup errors gracefully", () => {
    // Override the global eval mock to throw an error for this test
    global.eval = jest.fn(() => {
      throw new Error("Syntax error in code");
    });

    render(
      <ObjectStorageProvider config={objectStorageConfig}>
        <AgentSimulationComponent
          authoredState={defaultAuthoredState}
          interactiveState={defaultInteractiveState}
          setInteractiveState={mockSetInteractiveState}
        />
      </ObjectStorageProvider>
    );

    expect(screen.getByText("Error setting up simulation: Error: Syntax error in code")).toBeInTheDocument();
  });

  it("cleans up simulation and listeners on unmount", () => {
    mockUseLinkedInteractiveId.mockReturnValue("linked-interactive-id");

    const { unmount } = render(
      <ObjectStorageProvider config={objectStorageConfig}>
        <AgentSimulationComponent
          authoredState={defaultAuthoredState}
          interactiveState={defaultInteractiveState}
          setInteractiveState={mockSetInteractiveState}
        />
      </ObjectStorageProvider>
    );

    unmount();

    expect(mockRemoveLinkedInteractiveStateListener).toHaveBeenCalled();
    expect(mockAgentSimulation.destroy).toHaveBeenCalled();
  });

  it("works in report mode", () => {
    render(
      <ObjectStorageProvider config={objectStorageConfig}>
        <AgentSimulationComponent
          authoredState={defaultAuthoredState}
          interactiveState={defaultInteractiveState}
          setInteractiveState={mockSetInteractiveState}
          report={true}
        />
      </ObjectStorageProvider>
    );

    // Should still render the simulation
    expect(mockSimulationConstructor).toHaveBeenCalled();
    expect(screen.getByTestId("reset-button")).toBeInTheDocument();
    expect(screen.getByTestId("play-pause-button")).toBeInTheDocument();
  });

  it("handles non-string code from linked interactive", () => {
    mockUseLinkedInteractiveId.mockReturnValue("linked-interactive-id");

    render(
      <ObjectStorageProvider config={objectStorageConfig}>
        <AgentSimulationComponent
          authoredState={defaultAuthoredState}
          interactiveState={defaultInteractiveState}
          setInteractiveState={mockSetInteractiveState}
        />
      </ObjectStorageProvider>
    );

    // Simulate receiving invalid code from linked interactive
    const listenerCall = mockAddLinkedInteractiveStateListener.mock.calls[0];
    const listener = listenerCall[0];
    const newLinkedState = { code: null }; // Non-string code

    act(() => {
      listener(newLinkedState);
    });

    // Update button should remain disabled
    const updateButton = screen.getByTestId("update-code-button");
    expect(updateButton).toBeDisabled();
  });

  it("uses existing blockly code from interactive state", () => {
    const stateWithBlocklyCode: IInteractiveState = {
      ...defaultInteractiveState,
      blocklyCode: "// Existing blockly code"
    };

    // Override the global eval mock to capture the function code
    const mockFunction = jest.fn();
    global.eval = jest.fn((code) => {
      // Verify the code string contains the blockly code
      expect(code).toBe("(sim, AA, AV, globals, addWidget) => { // Existing blockly code }");
      return mockFunction;
    });

    render(
      <ObjectStorageProvider config={objectStorageConfig}>
        <AgentSimulationComponent
          authoredState={defaultAuthoredState}
          interactiveState={stateWithBlocklyCode}
          setInteractiveState={mockSetInteractiveState}
        />
      </ObjectStorageProvider>
    );

    // Verify the evaluated function was called with our specific mocks
    expect(mockFunction).toHaveBeenCalledWith(
      mockSimulation,
      AA,
      AV,
      mockGlobals,
      expect.any(Function) // addWidget function
    );
  });

  it("falls back to authored code when no blockly code exists", () => {
    // Override the global eval mock to capture the function code
    const mockFunction = jest.fn();
    global.eval = jest.fn((code) => {
      // Verify the code string contains the default code
      expect(code).toBe("(sim, AA, AV, globals, addWidget) => { // Default simulation code }");
      return mockFunction;
    });

    render(
      <ObjectStorageProvider config={objectStorageConfig}>
        <AgentSimulationComponent
          authoredState={defaultAuthoredState}
          interactiveState={defaultInteractiveState}
          setInteractiveState={mockSetInteractiveState}
        />
      </ObjectStorageProvider>
    );

    // Verify the evaluated function was called with our specific mocks
    expect(mockFunction).toHaveBeenCalledWith(
      mockSimulation,
      AA,
      AV,
      mockGlobals,
      expect.any(Function) // addWidget function
    );
  });

  it("preserves interactive widget globals (sliders) but not display widgets (readouts)", () => {
    // Set up globals with both slider and readout values
    mockGlobals.values.mockReturnValue({ slider1: 42, readout1: 99 });

    // Set up both slider and readout widgets
    const mockWidgets = [
      { globalKey: "slider1", type: "slider" as const, defaultValue: 0 },
      { globalKey: "readout1", type: "readout" as const }
    ];
    mockAgentSimulation.widgets = mockWidgets;

    render(
      <ObjectStorageProvider config={objectStorageConfig}>
        <AgentSimulationComponent
          authoredState={defaultAuthoredState}
          interactiveState={defaultInteractiveState}
          setInteractiveState={mockSetInteractiveState}
          report={false}
        />
      </ObjectStorageProvider>
    );

    // Start the simulation to enable the reset button.
    const playButton = screen.getByTestId("play-pause-button");
    fireEvent.click(playButton);

    // Update the globals on the current simulation instance.
    mockGlobals.values.mockReturnValue({ slider1: 77, readout1: 123 });

    // Click reset button.
    const resetButton = screen.getByTestId("reset-button");
    fireEvent.click(resetButton);

    // The constructor should be called twice: once on initial render, once on reset.
    // The second call should preserve only the slider value, not the readout.
    expect(mockSimulationConstructor).toHaveBeenCalledTimes(2);
    expect(mockSimulationConstructor).toHaveBeenNthCalledWith(
      2, // Second call
      450, 450, 15, { slider1: 77 }
    );
  });

  it("does not preserve readout widget globals across resets", () => {
    // Set up globals with both slider and readout values, plus a non-widget global
    mockGlobals.values.mockReturnValue({ slider1: 50, Sheep: 100, someOtherValue: 42 });

    // Set up slider widget and readout widget
    const mockWidgets = [
      { globalKey: "slider1", type: "slider" as const, defaultValue: 0 },
      { globalKey: "Sheep", type: "readout" as const }
    ];
    mockAgentSimulation.widgets = mockWidgets;

    render(
      <ObjectStorageProvider config={objectStorageConfig}>
        <AgentSimulationComponent
          authoredState={defaultAuthoredState}
          interactiveState={defaultInteractiveState}
          setInteractiveState={mockSetInteractiveState}
          report={false}
        />
      </ObjectStorageProvider>
    );

    // Click reset button
    const resetButton = screen.getByTestId("reset-button");
    fireEvent.click(resetButton);

    // The constructor should be called twice
    // The second call should only preserve slider1 (interactive widget),
    // not Sheep (readout widget) or someOtherValue (non-widget)
    expect(mockSimulationConstructor).toHaveBeenCalledTimes(2);
    expect(mockSimulationConstructor).toHaveBeenNthCalledWith(
      2, // Second call
      450, 450, 15, { slider1: 50 } // Only the slider global is preserved
    );
  });

  describe("simulation speed functionality", () => {
    it("initializes simulation with default speed", () => {
      render(
        <ObjectStorageProvider config={objectStorageConfig}>
          <AgentSimulationComponent
            authoredState={defaultAuthoredState}
            interactiveState={defaultInteractiveState}
            setInteractiveState={mockSetInteractiveState}
          />
        </ObjectStorageProvider>
      );

      expect(screen.getByTestId("sim-speed-select")).toHaveValue("1");
    });

    it("initializes simulation with saved speed from interactive state", () => {
      const stateWithSpeed: IInteractiveState = {
        ...defaultInteractiveState,
        simSpeed: 2
      };

      render(
        <ObjectStorageProvider config={objectStorageConfig}>
          <AgentSimulationComponent
            authoredState={defaultAuthoredState}
            interactiveState={stateWithSpeed}
            setInteractiveState={mockSetInteractiveState}
          />
        </ObjectStorageProvider>
      );

      expect(screen.getByTestId("sim-speed-select")).toHaveValue("2");
    });

    it("updates simulation speed when changed", () => {
      render(
        <ObjectStorageProvider config={objectStorageConfig}>
          <AgentSimulationComponent
            authoredState={defaultAuthoredState}
            interactiveState={defaultInteractiveState}
            setInteractiveState={mockSetInteractiveState}
          />
        </ObjectStorageProvider>
      );

      const speedSelect = screen.getByTestId("sim-speed-select");
      fireEvent.change(speedSelect, { target: { value: "2" } });

      expect(mockSetInteractiveState).toHaveBeenCalledWith(expect.any(Function));

      const updateFunction = mockSetInteractiveState.mock.calls[0][0];
      const newState = updateFunction(defaultInteractiveState);

      expect(newState).toEqual({
        ...defaultInteractiveState,
        answerType: "interactive_state",
        version: 1,
        simSpeed: 2,
        recordings: [],
        blocklyCode: "",
      });
    });
  });

  describe("recording functionality", () => {
    beforeEach(() => {
      mockAgentSimulation.widgets = [
        { globalKey: "speed", type: "slider", defaultValue: 10 },
        { globalKey: "count", type: "circular-slider", defaultValue: 5 }
      ];
      mockGlobals.values.mockReturnValue({ speed: 20, count: 8 });
    });

    it("captures global values when starting a recording", async () => {
      render(
        <ObjectStorageProvider config={objectStorageConfig}>
          <AgentSimulationComponent
            authoredState={defaultAuthoredState}
            interactiveState={defaultInteractiveState}
            setInteractiveState={mockSetInteractiveState}
          />
        </ObjectStorageProvider>
      );

      // Wait for initial pause
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 10));
      });

      const newButton = screen.getByText("New");
      fireEvent.click(newButton);

      // Wait for recording mode setup
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 10));
      });

      const playButton = screen.getByTestId("play-pause-button");
      fireEvent.click(playButton);

      // Wait for the reset and recording to start
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 20));
      });

      expect(mockSetInteractiveState).toHaveBeenCalled();

      // Find the call that includes recordings with globalValues
      const calls = mockSetInteractiveState.mock.calls;
      const recordingCall = calls.find(call => {
        if (typeof call[0] === "function") {
          const result = call[0]({ recordings: [] });
          return result.recordings && result.recordings.length > 0 && result.recordings[0].globalValues;
        }
        return false;
      });

      expect(recordingCall).toBeDefined();
      if (recordingCall) {
        const result = recordingCall[0]({ recordings: [] });
        expect(result.recordings[0].globalValues).toEqual({ speed: 20, count: 8 });
      }
    });

    it("preserves global values when resetting simulation before starting recording", async () => {
      render(
        <ObjectStorageProvider config={objectStorageConfig}>
          <AgentSimulationComponent
            authoredState={defaultAuthoredState}
            interactiveState={defaultInteractiveState}
            setInteractiveState={mockSetInteractiveState}
          />
        </ObjectStorageProvider>
      );

      // Wait for initial pause
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 10));
      });

      const newButton = screen.getByText("New");
      fireEvent.click(newButton);

      // Wait for recording mode setup
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 10));
      });

      const callsBeforePlay = mockSimulationConstructor.mock.calls.length;
      const playButton = screen.getByTestId("play-pause-button");
      fireEvent.click(playButton);

      // Wait for the reset
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 20));
      });

      expect(mockSimulationConstructor.mock.calls.length).toBeGreaterThan(callsBeforePlay);
      const lastCall = mockSimulationConstructor.mock.calls[mockSimulationConstructor.mock.calls.length - 1];
      expect(lastCall[3]).toEqual({ speed: 20, count: 8 });
    });
  });

  describe("save-failure handling", () => {
    let mockAdd: jest.Mock;
    let mockPublish: jest.Mock;
    let logSpy: jest.SpyInstance;
    let consoleErrorSpy: jest.SpyInstance;
    let resolveAdd: ((value: any) => void) | undefined;
    let rejectAdd: ((reason: any) => void) | undefined;

    const renderWithFailingAdd = (interactiveState: IInteractiveState = defaultInteractiveState) => {
      return render(
        <ObjectStorageProvider config={objectStorageConfig}>
          <AgentSimulationComponent
            authoredState={defaultAuthoredState}
            interactiveState={interactiveState}
            setInteractiveState={mockSetInteractiveState}
          />
        </ObjectStorageProvider>
      );
    };

    // Drive a recording from New → Play → Stop. add() is whatever mockAdd is rigged
    // to return for the given test.
    const startAndStopRecording = async () => {
      // Wait for initial pause
      await act(async () => { await new Promise(resolve => setTimeout(resolve, 10)); });

      fireEvent.click(screen.getByText("New"));
      await act(async () => { await new Promise(resolve => setTimeout(resolve, 10)); });

      // Click play to start
      fireEvent.click(screen.getByTestId("play-pause-button"));
      await act(async () => { await new Promise(resolve => setTimeout(resolve, 20)); });

      // Click again to stop
      fireEvent.click(screen.getByTestId("play-pause-button"));
      // Let the save() async chain start.
      await act(async () => { await new Promise(resolve => setTimeout(resolve, 10)); });
    };

    beforeEach(() => {
      mockAgentSimulation.widgets = [
        { globalKey: "speed", type: "slider", defaultValue: 10 },
      ];
      mockGlobals.values.mockReturnValue({ speed: 20 });

      mockAdd = jest.fn();
      mockPublish = jest.fn();
      mockCreatePubSubChannel.mockReturnValue({
        publish: mockPublish,
        subscribe: jest.fn(),
        unsubscribe: jest.fn(),
      });

      // Override the object-storage hook to inject our controllable mockAdd.
      // readMetadata returns a truthy stub so the broken-history detection
      // effect classifies these recordings as "ok" (not broken). Save-failure
      // tests focus on the save path, not broken-history detection.
      mockUseObjectStorage.mockReturnValue({
        add: mockAdd,
        list: jest.fn(),
        monitor: jest.fn(),
        read: jest.fn(),
        readMetadata: jest.fn(() => Promise.resolve({})),
        readData: jest.fn(),
        readDataItem: jest.fn(),
      });

      // Spies — reset on each test.
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const lara = require("@concord-consortium/lara-interactive-api");
      logSpy = jest.spyOn(lara, "log").mockImplementation(() => undefined);
      consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => undefined);

      resolveAdd = undefined;
      rejectAdd = undefined;
    });

    afterEach(() => {
      logSpy.mockRestore();
      consoleErrorSpy.mockRestore();
    });

    it("shows the error modal, placeholder, and emits telemetry when add() rejects", async () => {
      mockAdd.mockImplementation(() => Promise.reject(new Error("doc too big")));

      renderWithFailingAdd();
      await startAndStopRecording();

      // Let microtasks settle so catch handler runs.
      await act(async () => { await new Promise(resolve => setTimeout(resolve, 30)); });

      // Modal is open.
      expect(screen.getByRole("dialog")).toBeInTheDocument();
      expect(screen.getByText("Recording Save Failed")).toBeInTheDocument();

      // Placeholder is rendered.
      const placeholder = document.querySelector('[data-broken="true"]');
      expect(placeholder).not.toBeNull();
      expect(placeholder?.getAttribute("aria-label")).toMatch(/failed to save/);

      // console.error called.
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "[agent-simulation] Recording save failed",
        expect.objectContaining({ errorMessage: "doc too big", approximateSizeBytes: expect.any(Number) })
      );
      // log event dispatched.
      expect(logSpy).toHaveBeenCalledWith(
        "save-recording-failed",
        expect.objectContaining({ errorMessage: "doc too big", approximateSizeBytes: expect.any(Number) })
      );
      // recording-save-failed publish happened.
      const failedPublish = mockPublish.mock.calls.find(
        c => c[0]?.topic === "recording-save-failed"
      );
      expect(failedPublish).toBeDefined();
    });

    it("publishes recording-save-failed before the state update that opens the modal", async () => {
      let internalReject: ((err: any) => void) | undefined;
      mockAdd.mockImplementation(() => new Promise((_, rj) => { internalReject = rj; }));

      renderWithFailingAdd();
      await startAndStopRecording();

      // No modal yet — add() is still pending.
      expect(screen.queryByText("Recording Save Failed")).not.toBeInTheDocument();

      mockPublish.mockClear();
      mockSetInteractiveState.mockClear();

      internalReject?.(new Error("doc too big"));
      await act(async () => { await new Promise(resolve => setTimeout(resolve, 30)); });

      // Find the recording-save-failed publish invocation.
      const failedPublishCallIdx = mockPublish.mock.calls.findIndex(
        c => c[0]?.topic === "recording-save-failed"
      );
      expect(failedPublishCallIdx).toBeGreaterThanOrEqual(0);

      // Find the setInteractiveState call that filters the in-progress entry
      // (the state update happening just before setFailedSaveInfo opens the modal).
      let filterStateCallIdx = -1;
      for (let i = 0; i < mockSetInteractiveState.mock.calls.length; i++) {
        const fn = mockSetInteractiveState.mock.calls[i][0];
        if (typeof fn === "function") {
          const result = fn({ recordings: [] });
          if (result.recordings && result.recordings.length === 0) {
            filterStateCallIdx = i;
            break;
          }
        }
      }
      expect(filterStateCallIdx).toBeGreaterThanOrEqual(0);

      // Robust against React batching: assert publish happened before the
      // recordings-cleared state update (which immediately precedes the modal
      // open) via mock.invocationCallOrder.
      const publishOrder = mockPublish.mock.invocationCallOrder[failedPublishCallIdx];
      const stateOrder = mockSetInteractiveState.mock.invocationCallOrder[filterStateCallIdx];
      expect(publishOrder).toBeLessThan(stateOrder);

      expect(screen.getByText("Recording Save Failed")).toBeInTheDocument();
    });

    it("removes the placeholder and modal when OK is clicked", async () => {
      mockAdd.mockImplementation(() => Promise.reject(new Error("doc too big")));

      renderWithFailingAdd();
      await startAndStopRecording();
      await act(async () => { await new Promise(resolve => setTimeout(resolve, 30)); });

      expect(screen.getByRole("dialog")).toBeInTheDocument();

      // Click OK
      fireEvent.click(screen.getByRole("button", { name: "OK" }));
      // Modal closed.
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
      // Placeholder removed.
      expect(document.querySelector('[data-broken="true"]')).toBeNull();
    });

    it("does not add an entry to recordings/interactiveState on save failure", async () => {
      mockAdd.mockImplementation(() => Promise.reject(new Error("doc too big")));

      renderWithFailingAdd();
      await startAndStopRecording();
      await act(async () => { await new Promise(resolve => setTimeout(resolve, 30)); });

      // After failure, the most recent setInteractiveState call should have an
      // empty recordings array (the in-progress entry was filtered out).
      const calls = mockSetInteractiveState.mock.calls;
      // Walk back from the last call until we find one that produces a state.
      let finalRecordings: any[] | undefined;
      for (let i = calls.length - 1; i >= 0; i--) {
        const fn = calls[i][0];
        if (typeof fn === "function") {
          const result = fn({ recordings: [] });
          finalRecordings = result.recordings;
          break;
        }
      }
      expect(finalRecordings).toBeDefined();
      expect(finalRecordings).toEqual([]);
    });

    it("treats a 30s timeout identically to a rejection (modal, placeholder, log event)", async () => {
      jest.useFakeTimers();
      // add() never resolves.
      mockAdd.mockImplementation(() => new Promise(() => undefined));

      renderWithFailingAdd();

      // Drive the recording while fake timers are active. setTimeout-based waits
      // must use jest.advanceTimersByTime + Promise microtask flush.
      // We use jest.useFakeTimers AFTER setup so that the act() helpers in
      // startAndStopRecording's setTimeout(...,10/20) still work. We manually
      // advance to drive them.
      await act(async () => { jest.advanceTimersByTime(10); await Promise.resolve(); });
      fireEvent.click(screen.getByText("New"));
      await act(async () => { jest.advanceTimersByTime(10); await Promise.resolve(); });
      fireEvent.click(screen.getByTestId("play-pause-button"));
      await act(async () => { jest.advanceTimersByTime(20); await Promise.resolve(); });
      fireEvent.click(screen.getByTestId("play-pause-button"));
      // Allow microtasks so save() begins.
      await act(async () => { await Promise.resolve(); });

      // Advance the 30s timeout.
      await act(async () => {
        jest.advanceTimersByTime(30_000);
        // Flush microtasks so the rejection propagates into the catch handler.
        await Promise.resolve();
        await Promise.resolve();
      });

      // Switch back to real timers so any waitFor / act async settles.
      jest.useRealTimers();
      await act(async () => { await new Promise(resolve => setTimeout(resolve, 30)); });

      expect(screen.getByText("Recording Save Failed")).toBeInTheDocument();
      expect(document.querySelector('[data-broken="true"]')).not.toBeNull();
      expect(logSpy).toHaveBeenCalledWith(
        "save-recording-failed",
        expect.objectContaining({ errorMessage: "save timed out after 30s" })
      );
    });

    it("dismisses an open delete-confirm modal before opening the error modal (single-modal policy)", async () => {
      // First save succeeds — recording 0 is created so delete-confirm can be opened.
      mockAdd.mockImplementation(() => Promise.resolve({} as any));

      renderWithFailingAdd();
      await startAndStopRecording();
      await act(async () => { await new Promise(resolve => setTimeout(resolve, 30)); });
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

      // Second recording: switch mockAdd to a pending-then-rejecting promise so
      // we can observe the in-flight save window and trigger failure manually.
      let rejectSecondSave: ((err: any) => void) | undefined;
      mockAdd.mockImplementation(() => new Promise((_, rj) => { rejectSecondSave = rj; }));

      // Start recording 1, then stop it. After stop the save is in flight.
      fireEvent.click(screen.getByText("New"));
      await act(async () => { await new Promise(resolve => setTimeout(resolve, 10)); });
      fireEvent.click(screen.getByTestId("play-pause-button"));
      await act(async () => { await new Promise(resolve => setTimeout(resolve, 20)); });
      fireEvent.click(screen.getByTestId("play-pause-button"));
      await act(async () => { await new Promise(resolve => setTimeout(resolve, 10)); });

      // Save for recording 1 is pending. Switch selection to recording 0 (saved)
      // so the delete-recording-button becomes enabled.
      fireEvent.click(screen.getByRole("button", { name: "Recording 1" }));
      await act(async () => { await new Promise(resolve => setTimeout(resolve, 10)); });

      // Open delete-confirm for recording 0.
      fireEvent.click(screen.getByTestId("delete-recording-button"));
      await act(async () => { await new Promise(resolve => setTimeout(resolve, 10)); });
      expect(screen.getByText("Delete Recording")).toBeInTheDocument();

      // Now reject the pending save for recording 1. The catch handler should
      // dismiss the delete-confirm and open the error modal.
      rejectSecondSave?.(new Error("doc too big"));
      await act(async () => { await new Promise(resolve => setTimeout(resolve, 30)); });

      // Only the error modal should remain.
      const dialogs = screen.queryAllByRole("dialog");
      expect(dialogs).toHaveLength(1);
      expect(screen.getByText("Recording Save Failed")).toBeInTheDocument();
      expect(screen.queryByText("Delete Recording")).not.toBeInTheDocument();
    });

    it("recovers cleanly across repeat failures (no stale state between cycles)", async () => {
      mockAdd.mockImplementation(() => Promise.reject(new Error("doc too big")));

      renderWithFailingAdd();
      // First failure cycle.
      await startAndStopRecording();
      await act(async () => { await new Promise(resolve => setTimeout(resolve, 30)); });

      expect(screen.getByText("Recording Save Failed")).toBeInTheDocument();
      expect(logSpy).toHaveBeenCalledWith(
        "save-recording-failed",
        expect.objectContaining({ errorMessage: "doc too big" })
      );
      // Dismiss.
      fireEvent.click(screen.getByRole("button", { name: "OK" }));
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

      logSpy.mockClear();

      // Second failure cycle.
      fireEvent.click(screen.getByText("New"));
      await act(async () => { await new Promise(resolve => setTimeout(resolve, 10)); });
      fireEvent.click(screen.getByTestId("play-pause-button"));
      await act(async () => { await new Promise(resolve => setTimeout(resolve, 20)); });
      fireEvent.click(screen.getByTestId("play-pause-button"));
      await act(async () => { await new Promise(resolve => setTimeout(resolve, 30)); });

      // Second modal opens fresh.
      expect(screen.getByText("Recording Save Failed")).toBeInTheDocument();
      expect(logSpy).toHaveBeenCalledWith(
        "save-recording-failed",
        expect.objectContaining({ errorMessage: "doc too big" })
      );
    });

    it("renders the saving overlay during the in-flight save window and clears it on success", async () => {
      // add() returns a promise we can resolve manually.
      const addPromise = new Promise<any>((resolve) => { resolveAdd = resolve; });
      mockAdd.mockImplementation(() => addPromise);

      renderWithFailingAdd();
      await startAndStopRecording();
      // The in-progress entry now has no objectId and is not the currently-recording one.
      // It should render with data-saving="true".
      const savingBtn = document.querySelector('[data-saving="true"]');
      expect(savingBtn).not.toBeNull();
      expect(savingBtn?.getAttribute("aria-label")).toMatch(/saving/);
      // The button is disabled while saving.
      expect(savingBtn).toBeDisabled();

      // Non-selectability: clicking the disabled saving button must not publish
      // recording-selected. (fireEvent.click respects `disabled` on buttons.)
      mockPublish.mockClear();
      if (savingBtn) fireEvent.click(savingBtn);
      const selectPublishes = mockPublish.mock.calls.filter(
        c => c[0]?.topic === "recording-selected"
      );
      expect(selectPublishes).toHaveLength(0);

      // Resolve the save.
      resolveAdd?.({});
      await act(async () => { await new Promise(resolve => setTimeout(resolve, 30)); });

      // After success, the saving indicator clears.
      expect(document.querySelector('[data-saving="true"]')).toBeNull();
    });

    it("transitions from saving to broken placeholder on failure", async () => {
      const addPromise = new Promise<any>((_, reject) => { rejectAdd = reject; });
      mockAdd.mockImplementation(() => addPromise);

      renderWithFailingAdd();
      await startAndStopRecording();
      // Saving indicator visible.
      expect(document.querySelector('[data-saving="true"]')).not.toBeNull();

      rejectAdd?.(new Error("doc too big"));
      await act(async () => { await new Promise(resolve => setTimeout(resolve, 30)); });

      // Saving indicator gone; broken placeholder visible.
      expect(document.querySelector('[data-saving="true"]')).toBeNull();
      expect(document.querySelector('[data-broken="true"]')).not.toBeNull();
    });

    it("cleanup invariant: a remount with the post-failure interactiveState yields zero recording entries", async () => {
      mockAdd.mockImplementation(() => Promise.reject(new Error("doc too big")));

      const { unmount } = renderWithFailingAdd();
      await startAndStopRecording();
      await act(async () => { await new Promise(resolve => setTimeout(resolve, 30)); });

      // Dismiss the modal.
      fireEvent.click(screen.getByRole("button", { name: "OK" }));

      // Capture the latest interactiveState recorded by the parent setter.
      const calls = mockSetInteractiveState.mock.calls;
      let latestRecordings: any[] | undefined;
      for (let i = calls.length - 1; i >= 0; i--) {
        const fn = calls[i][0];
        if (typeof fn === "function") {
          const result = fn({ recordings: [] });
          if (Array.isArray(result.recordings)) {
            latestRecordings = result.recordings;
            break;
          }
        }
      }
      expect(latestRecordings).toEqual([]);

      // Unmount and remount with the captured state — no partial entry should resurrect.
      unmount();
      const remountedState: IInteractiveState = {
        ...defaultInteractiveState,
        recordings: latestRecordings ?? [],
      };
      render(
        <ObjectStorageProvider config={objectStorageConfig}>
          <AgentSimulationComponent
            authoredState={defaultAuthoredState}
            interactiveState={remountedState}
            setInteractiveState={mockSetInteractiveState}
          />
        </ObjectStorageProvider>
      );

      // No recording buttons rendered (only the "New" button + scroll arrows).
      // recording-strip renders recording buttons without an aria-label by default;
      // we identify them by data-saving/data-broken absence and the labeled "New" button.
      const newButton = screen.getByText("New");
      expect(newButton).toBeInTheDocument();
      // Assert: no broken placeholder, no saving entry, no recording-1 button.
      expect(document.querySelector('[data-broken="true"]')).toBeNull();
      expect(document.querySelector('[data-saving="true"]')).toBeNull();
      expect(screen.queryByRole("button", { name: "Recording 1" })).not.toBeInTheDocument();
    });

    it("auto-stop via maxRecordingTime triggers the same failure flow as user-stop", async () => {
      mockAdd.mockImplementation(() => Promise.reject(new Error("doc too big")));

      // 1-second maxRecordingTime so the 500ms-interval check trips quickly.
      const shortAuthored: IAuthoredState = { ...defaultAuthoredState, maxRecordingTime: 1 };

      render(
        <ObjectStorageProvider config={objectStorageConfig}>
          <AgentSimulationComponent
            authoredState={shortAuthored}
            interactiveState={defaultInteractiveState}
            setInteractiveState={mockSetInteractiveState}
          />
        </ObjectStorageProvider>
      );

      // Initial pause.
      await act(async () => { await new Promise(resolve => setTimeout(resolve, 10)); });

      fireEvent.click(screen.getByText("New"));
      await act(async () => { await new Promise(resolve => setTimeout(resolve, 10)); });

      // Click play to start recording. Then wait > maxRecordingTime (1s) so the
      // 500ms-interval auto-stop fires via handlePlayPauseRef.current(). The
      // third interval tick at ~1500ms is the one that first sees duration >
      // 1000ms; 2000ms gives margin for the rejection chain to settle on
      // slower CI runners.
      fireEvent.click(screen.getByTestId("play-pause-button"));
      await act(async () => { await new Promise(resolve => setTimeout(resolve, 2000)); });

      // Save failure should have surfaced through the same channels as user-stop.
      expect(screen.getByText("Recording Save Failed")).toBeInTheDocument();
      expect(document.querySelector('[data-broken="true"]')).not.toBeNull();
      expect(logSpy).toHaveBeenCalledWith(
        "save-recording-failed",
        expect.objectContaining({ errorMessage: "doc too big" })
      );
      const failedPublish = mockPublish.mock.calls.find(
        c => c[0]?.topic === "recording-save-failed"
      );
      expect(failedPublish).toBeDefined();
    });
  });

  describe("broken-history detection", () => {
    let mockReadMetadata: jest.Mock;
    let mockPublish: jest.Mock;

    const renderWithMetadata = (interactiveState: IInteractiveState) => {
      return render(
        <ObjectStorageProvider config={objectStorageConfig}>
          <AgentSimulationComponent
            authoredState={defaultAuthoredState}
            interactiveState={interactiveState}
            setInteractiveState={mockSetInteractiveState}
          />
        </ObjectStorageProvider>
      );
    };

    beforeEach(() => {
      mockAgentSimulation.widgets = [];
      mockGlobals.values.mockReturnValue({});

      mockReadMetadata = jest.fn();
      mockPublish = jest.fn();
      mockCreatePubSubChannel.mockReturnValue({
        publish: mockPublish,
        subscribe: jest.fn(),
        unsubscribe: jest.fn(),
      });
      mockUseObjectStorage.mockReturnValue({
        add: jest.fn(),
        list: jest.fn(),
        monitor: jest.fn(),
        read: jest.fn(),
        readMetadata: mockReadMetadata,
        readData: jest.fn(),
        readDataItem: jest.fn(),
      });
    });

    it("marks entries whose readMetadata returns undefined as broken (data-broken='true')", async () => {
      mockReadMetadata.mockImplementation((objectId: string) => {
        if (objectId === "broken-id") return Promise.resolve(undefined);
        return Promise.resolve({});
      });

      const state: IInteractiveState = {
        ...defaultInteractiveState,
        recordings: [
          { modelName: "Model 1", objectId: "ok-id", startedAt: 1000, duration: 5000 },
          { modelName: "Model 1", objectId: "broken-id", startedAt: 2000, duration: 5000 },
        ],
      };

      renderWithMetadata(state);
      // Wait for the broken-detection effect to resolve.
      await act(async () => { await new Promise(resolve => setTimeout(resolve, 30)); });

      const brokenButtons = document.querySelectorAll('[data-broken="true"]');
      // Only one broken-history button should be present (the failed-save
      // placeholder isn't rendered here).
      expect(brokenButtons.length).toBe(1);
      expect(brokenButtons[0].getAttribute("aria-label")).toMatch(
        /Recording 2 - data missing, cannot play, select to delete/
      );
    });

    it("treats readMetadata throws as unknown (entry rendered normally, not broken)", async () => {
      mockReadMetadata.mockImplementation((objectId: string) => {
        if (objectId === "thrown-id") return Promise.reject(new Error("transient network"));
        return Promise.resolve({});
      });

      const state: IInteractiveState = {
        ...defaultInteractiveState,
        recordings: [
          { modelName: "Model 1", objectId: "thrown-id", startedAt: 1000, duration: 5000 },
        ],
      };

      renderWithMetadata(state);
      await act(async () => { await new Promise(resolve => setTimeout(resolve, 30)); });

      // Entry should not be marked broken (treated as unknown).
      expect(document.querySelector('[data-broken="true"]')).toBeNull();
    });

    it("clicking a broken entry selects it without publishing recording-selected or polling", async () => {
      mockReadMetadata.mockImplementation((objectId: string) => {
        if (objectId === "broken-id") return Promise.resolve(undefined);
        return Promise.resolve({});
      });

      const state: IInteractiveState = {
        ...defaultInteractiveState,
        recordings: [
          { modelName: "Model 1", objectId: "broken-id", startedAt: 1000, duration: 5000 },
        ],
      };

      renderWithMetadata(state);
      await act(async () => { await new Promise(resolve => setTimeout(resolve, 30)); });

      // Initial mount publishes nothing related to recording-selected.
      mockPublish.mockClear();

      const brokenBtn = document.querySelector('[data-broken="true"]') as HTMLButtonElement;
      expect(brokenBtn).not.toBeNull();
      fireEvent.click(brokenBtn);
      await act(async () => { await new Promise(resolve => setTimeout(resolve, 10)); });

      // No recording-selected publish.
      const selectPublishes = mockPublish.mock.calls.filter(
        c => c[0]?.topic === "recording-selected"
      );
      expect(selectPublishes).toHaveLength(0);
    });

    it("Play is disabled when a broken entry is selected; Delete is enabled", async () => {
      mockReadMetadata.mockImplementation((objectId: string) => {
        if (objectId === "broken-id") return Promise.resolve(undefined);
        return Promise.resolve({});
      });

      const state: IInteractiveState = {
        ...defaultInteractiveState,
        recordings: [
          { modelName: "Model 1", objectId: "broken-id", startedAt: 1000, duration: 5000 },
        ],
      };

      renderWithMetadata(state);
      await act(async () => { await new Promise(resolve => setTimeout(resolve, 30)); });

      const brokenBtn = document.querySelector('[data-broken="true"]') as HTMLButtonElement;
      fireEvent.click(brokenBtn);
      await act(async () => { await new Promise(resolve => setTimeout(resolve, 10)); });

      // Play should be disabled (selectedIsBroken gate).
      const playBtn = screen.getByTestId("play-pause-button");
      expect(playBtn).toBeDisabled();
      // Delete should be enabled.
      const deleteBtn = screen.getByTestId("delete-recording-button");
      expect(deleteBtn).not.toBeDisabled();
    });

    it("metadata cache: cold mount fetches all ids; unmount/remount resets the cache (self-healing)", async () => {
      mockReadMetadata.mockImplementation(() => Promise.resolve({}));

      const fiveRecordings: IInteractiveState = {
        ...defaultInteractiveState,
        recordings: Array.from({ length: 5 }, (_, i) => ({
          modelName: "Model 1",
          objectId: `id-${i}`,
          startedAt: 1000 + i,
          duration: 5000,
        })),
      };

      const { unmount } = renderWithMetadata(fiveRecordings);
      await act(async () => { await new Promise(resolve => setTimeout(resolve, 30)); });

      // Cold mount: 5 calls.
      expect(mockReadMetadata).toHaveBeenCalledTimes(5);

      // Unmount and remount; cache is reset, so fetches happen again.
      unmount();
      mockReadMetadata.mockClear();
      renderWithMetadata(fiveRecordings);
      await act(async () => { await new Promise(resolve => setTimeout(resolve, 30)); });
      // 5 fetches on remount (cache cleared).
      expect(mockReadMetadata).toHaveBeenCalledTimes(5);
    });

    it("metadata cache: a new recording's objectId triggers only one new readMetadata call (delta-fetch)", async () => {
      // The cache delta-fetch is exercised via a successful save: existing recordings
      // are pre-mounted, then a new recording is added through the save success path.
      // The component's useState(recordings) is mount-initialized from interactiveState,
      // so changing the prop after mount won't update local state; the only way to add
      // a recording is through the component's own setRecordings flow.
      mockReadMetadata.mockImplementation(() => Promise.resolve({}));

      // Override useObjectStorage to provide a working add() so we can drive a save.
      const mockAdd = jest.fn(() => Promise.resolve({} as any));
      mockUseObjectStorage.mockReturnValue({
        add: mockAdd,
        list: jest.fn(),
        monitor: jest.fn(),
        read: jest.fn(),
        readMetadata: mockReadMetadata,
        readData: jest.fn(),
        readDataItem: jest.fn(),
      });

      const fiveRecordings: IInteractiveState = {
        ...defaultInteractiveState,
        recordings: Array.from({ length: 5 }, (_, i) => ({
          modelName: "Model 1",
          objectId: `id-${i}`,
          startedAt: 1000 + i,
          duration: 5000,
        })),
      };

      renderWithMetadata(fiveRecordings);
      await act(async () => { await new Promise(resolve => setTimeout(resolve, 30)); });
      // Cold mount fetched all 5 existing objectIds.
      expect(mockReadMetadata).toHaveBeenCalledTimes(5);

      mockReadMetadata.mockClear();

      // Drive a new recording so a 6th objectId is added.
      fireEvent.click(screen.getByText("New"));
      await act(async () => { await new Promise(resolve => setTimeout(resolve, 10)); });
      fireEvent.click(screen.getByTestId("play-pause-button"));
      await act(async () => { await new Promise(resolve => setTimeout(resolve, 20)); });
      fireEvent.click(screen.getByTestId("play-pause-button"));
      await act(async () => { await new Promise(resolve => setTimeout(resolve, 30)); });

      // Exactly one new readMetadata fetch — for the just-added objectId.
      // (Existing 5 ids stay in cache and aren't re-fetched.)
      expect(mockReadMetadata).toHaveBeenCalledTimes(1);
    });

    it("starting a new recording clears any broken-entry selection", async () => {
      mockReadMetadata.mockImplementation((objectId: string) => {
        if (objectId === "broken-id") return Promise.resolve(undefined);
        return Promise.resolve({});
      });

      const state: IInteractiveState = {
        ...defaultInteractiveState,
        recordings: [
          { modelName: "Model 1", objectId: "broken-id", startedAt: 1000, duration: 5000 },
        ],
      };

      renderWithMetadata(state);
      await act(async () => { await new Promise(resolve => setTimeout(resolve, 30)); });

      // Select the broken entry.
      const brokenBtn = document.querySelector('[data-broken="true"]') as HTMLButtonElement;
      fireEvent.click(brokenBtn);
      await act(async () => { await new Promise(resolve => setTimeout(resolve, 10)); });

      // Confirm broken entry IS currently selected (has currentBrokenRecordingButton class).
      expect(brokenBtn.className).toMatch(/currentBrokenRecordingButton/);

      // Click New to start a new recording.
      fireEvent.click(screen.getByText("New"));
      await act(async () => { await new Promise(resolve => setTimeout(resolve, 10)); });

      // Direct assertion: the broken entry no longer carries the
      // currentBrokenRecordingButton selection outline — the new entry is now selected.
      const stillBrokenBtn = document.querySelector('[data-broken="true"]') as HTMLButtonElement;
      expect(stillBrokenBtn).not.toBeNull();
      expect(stillBrokenBtn.className).not.toMatch(/currentBrokenRecordingButton/);

      // Indirect consequence: Play is enabled now that no broken entry is selected.
      const playBtn = screen.getByTestId("play-pause-button");
      expect(playBtn).not.toBeDisabled();
    });
  });
});
