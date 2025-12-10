import React from "react";
import { render, screen, fireEvent, act } from "@testing-library/react";
import {
  addLinkedInteractiveStateListener,
  removeLinkedInteractiveStateListener
} from "@concord-consortium/lara-interactive-api";
import { AgentSimulationComponent } from "./agent-simulation";
import { IAuthoredState, IInteractiveState } from "./types";
import * as AA from "@gjmcn/atomic-agents";
import * as AV from "@concord-consortium/atomic-agents-vis";
import { useLinkedInteractiveId } from "@concord-consortium/question-interactives-helpers/src/hooks/use-linked-interactive-id";
import { AgentSimulation } from "../models/agent-simulation";
import { ObjectStorageConfig, ObjectStorageProvider } from "@concord-consortium/object-storage";
import { IWidgetProps } from "../types/widgets";

// Mock the dependencies
jest.mock("@concord-consortium/lara-interactive-api", () => ({
  addLinkedInteractiveStateListener: jest.fn(),
  removeLinkedInteractiveStateListener: jest.fn(),
  log: jest.fn(),
}));

jest.mock("@concord-consortium/question-interactives-helpers/src/hooks/use-linked-interactive-id", () => ({
  useLinkedInteractiveId: jest.fn()
}));

jest.mock("../models/agent-simulation", () => ({
  AgentSimulation: jest.fn()
}));

const mockUseLinkedInteractiveId = useLinkedInteractiveId as jest.Mock;
const mockAddLinkedInteractiveStateListener = addLinkedInteractiveStateListener as jest.Mock;
const mockRemoveLinkedInteractiveStateListener = removeLinkedInteractiveStateListener as jest.Mock;
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
});
