import React from "react";
import { render, screen, fireEvent, act } from "@testing-library/react";
import {
  addLinkedInteractiveStateListener,
  removeLinkedInteractiveStateListener
} from "@concord-consortium/lara-interactive-api";
import { AgentSimulationComponent } from "./agent-simulation";
import { IAuthoredState, IInteractiveState } from "./types";
import * as AA from "@gjmcn/atomic-agents";
import * as AV from "@gjmcn/atomic-agents-vis";
import { useLinkedInteractiveId } from "@concord-consortium/question-interactives-helpers/src/hooks/use-linked-interactive-id";
import { AgentSimulation } from "../models/agent-simulation";
import { ObjectStorageConfig, ObjectStorageProvider } from "@concord-consortium/object-storage";

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
    set: jest.fn()
  };

  const mockAddWidget = jest.fn();

  const mockAgentSimulation = {
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
    gridStep: 15
  };

  const defaultInteractiveState: IInteractiveState = {
    version: 1,
    answerType: "interactive_state",
    recordings: [],
  };

  const objectStorageConfig: ObjectStorageConfig = {
    version: 1,
    type: "demo",
  };

  const mockSetInteractiveState = jest.fn();

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

  it("creates simulation with correct parameters", () => {
    // Mock eval to return a simple function that doesn't throw
    const originalEval = global.eval;
    const mockFunction = jest.fn();
    global.eval = jest.fn(() => mockFunction);

    render(
      <ObjectStorageProvider config={objectStorageConfig}>
        <AgentSimulationComponent
          authoredState={defaultAuthoredState}
          interactiveState={defaultInteractiveState}
          setInteractiveState={mockSetInteractiveState}
        />
      </ObjectStorageProvider>
    );

    expect(mockSimulationConstructor).toHaveBeenCalledWith(450, 450, 15);

    expect(mockVis).toHaveBeenCalledWith(mockAgentSimulation.sim, { target: expect.any(HTMLDivElement), preserveDrawingBuffer: true });
    expect(mockSimulation.pause).toHaveBeenCalledWith(true);

    // Restore original eval
    global.eval = originalEval;
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

  it("handles pause/play button clicks", () => {
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

    // Reset button should be disabled initially
    const resetButton = screen.getByTestId("reset-button");
    expect(resetButton).toBeDisabled();

    // Start the simulation first by clicking play
    const playButton = screen.getByTestId("play-pause-button");
    fireEvent.click(playButton);

    // Now reset button should be enabled
    expect(resetButton).not.toBeDisabled();

    // Click reset button
    fireEvent.click(resetButton);

    // Should create a new simulation instance
    expect(mockSimulationConstructor.mock.calls.length).toBeGreaterThan(initialCallCount);

    // Reset button should be disabled again after reset
    expect(resetButton).toBeDisabled();
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

  it("handles simulation setup errors gracefully", () => {
    // Mock eval to throw an error
    const originalEval = global.eval;
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

    // Restore original eval
    global.eval = originalEval;
  });

  it("cleans up simulation and listeners on unmount", () => {
    mockUseLinkedInteractiveId.mockReturnValue("linked-interactive-id");

    // Mock eval to return a simple function that doesn't throw
    const originalEval = global.eval;
    const mockFunction = jest.fn();
    global.eval = jest.fn(() => mockFunction);

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

    // Restore original eval
    global.eval = originalEval;
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

    // Mock eval to capture the function code
    const originalEval = global.eval;
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

    global.eval = originalEval;
  });

  it("falls back to authored code when no blockly code exists", () => {
    // Mock eval to capture the function code
    const originalEval = global.eval;
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

    global.eval = originalEval;
  });
});