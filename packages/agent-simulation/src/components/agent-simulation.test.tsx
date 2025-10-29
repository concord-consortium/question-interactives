import React from "react";
import { render, screen, fireEvent, act } from "@testing-library/react";
import {
  addLinkedInteractiveStateListener,
  removeLinkedInteractiveStateListener
} from "@concord-consortium/lara-interactive-api";
import { AgentSimulationComponent } from "./agent-simulation";
import { IAuthoredState, IInteractiveState } from "./types";

// Mock the dependencies
jest.mock("@concord-consortium/lara-interactive-api", () => ({
  addLinkedInteractiveStateListener: jest.fn(),
  removeLinkedInteractiveStateListener: jest.fn()
}));

jest.mock("@concord-consortium/question-interactives-helpers/src/hooks/use-linked-interactive-id", () => ({
  useLinkedInteractiveId: jest.fn()
}));

// Mock the simulation classes with fresh instances for each test
const mockSimulation = {
  pause: jest.fn(),
  end: jest.fn()
};

jest.mock("@gjmcn/atomic-agents", () => ({
  Simulation: jest.fn()
}));

jest.mock("@gjmcn/atomic-agents-vis", () => ({
  vis: jest.fn()
}));

// Import the mocked modules for typing
import * as AA from "@gjmcn/atomic-agents";
import * as AV from "@gjmcn/atomic-agents-vis";
import { useLinkedInteractiveId } from "@concord-consortium/question-interactives-helpers/src/hooks/use-linked-interactive-id";

const mockUseLinkedInteractiveId = useLinkedInteractiveId as jest.Mock;
const mockAddLinkedInteractiveStateListener = addLinkedInteractiveStateListener as jest.Mock;
const mockRemoveLinkedInteractiveStateListener = removeLinkedInteractiveStateListener as jest.Mock;
const mockSimulationConstructor = AA.Simulation as jest.Mock;
const mockVis = AV.vis as jest.Mock;

describe("AgentSimulationComponent", () => {
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
    answerType: "interactive_state"
  };

  const mockSetInteractiveState = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    // Create fresh mock instances for each test
    mockSimulation.pause.mockClear();
    mockSimulation.end.mockClear();
    mockSimulationConstructor.mockReturnValue(mockSimulation);
    mockUseLinkedInteractiveId.mockReturnValue(null);
  });

  it("renders basic simulation controls", () => {
    render(
      <AgentSimulationComponent
        authoredState={defaultAuthoredState}
        interactiveState={defaultInteractiveState}
        setInteractiveState={mockSetInteractiveState}
      />
    );

    expect(screen.getByText("Reset")).toBeInTheDocument();
    expect(screen.getByText("Play")).toBeInTheDocument();
  });

  it("creates simulation with correct parameters", () => {
    // Mock eval to return a simple function that doesn't throw
    const originalEval = global.eval;
    const mockFunction = jest.fn();
    global.eval = jest.fn(() => mockFunction);

    render(
      <AgentSimulationComponent
        authoredState={defaultAuthoredState}
        interactiveState={defaultInteractiveState}
        setInteractiveState={mockSetInteractiveState}
      />
    );

    expect(mockSimulationConstructor).toHaveBeenCalledWith({
      gridStep: 15,
      height: 450,
      width: 450
    });

    expect(mockVis).toHaveBeenCalledWith(mockSimulation, { target: expect.any(HTMLDivElement) });
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
      <AgentSimulationComponent
        authoredState={invalidAuthoredState}
        interactiveState={defaultInteractiveState}
        setInteractiveState={mockSetInteractiveState}
      />
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
      <AgentSimulationComponent
        authoredState={invalidAuthoredState}
        interactiveState={defaultInteractiveState}
        setInteractiveState={mockSetInteractiveState}
      />
    );

    expect(screen.getByText("Grid height and width must be divisible by the grid step.")).toBeInTheDocument();
  });

  it("handles pause/play button clicks", () => {
    // Mock eval to return a simple function that doesn't throw
    const originalEval = global.eval;
    const mockFunction = jest.fn();
    global.eval = jest.fn(() => mockFunction);

    render(
      <AgentSimulationComponent
        authoredState={defaultAuthoredState}
        interactiveState={defaultInteractiveState}
        setInteractiveState={mockSetInteractiveState}
      />
    );

    const pausePlayButton = screen.getByText("Play");
    fireEvent.click(pausePlayButton);

    expect(mockSimulation.pause).toHaveBeenCalledWith(false);
    expect(screen.getByText("Pause")).toBeInTheDocument();

    fireEvent.click(screen.getByText("Pause"));
    expect(mockSimulation.pause).toHaveBeenCalledWith(true);

    // Restore original eval
    global.eval = originalEval;
  });

  it("handles reset button click", () => {
    render(
      <AgentSimulationComponent
        authoredState={defaultAuthoredState}
        interactiveState={defaultInteractiveState}
        setInteractiveState={mockSetInteractiveState}
      />
    );

    const initialCallCount = mockSimulationConstructor.mock.calls.length;

    fireEvent.click(screen.getByText("Reset"));

    // Should create a new simulation instance
    expect(mockSimulationConstructor.mock.calls.length).toBeGreaterThan(initialCallCount);
  });

  it("shows blockly code toggle when blockly code exists", () => {
    const stateWithBlocklyCode: IInteractiveState = {
      ...defaultInteractiveState,
      blocklyCode: "// Blockly generated code"
    };

    render(
      <AgentSimulationComponent
        authoredState={defaultAuthoredState}
        interactiveState={stateWithBlocklyCode}
        setInteractiveState={mockSetInteractiveState}
      />
    );

    expect(screen.getByText("Show Blockly Code")).toBeInTheDocument();

    fireEvent.click(screen.getByText("Show Blockly Code"));
    expect(screen.getByText("Hide Blockly Code")).toBeInTheDocument();
    expect(screen.getByText("// Blockly generated code")).toBeInTheDocument();
  });

  it("renders update code button when linked interactive is available", () => {
    mockUseLinkedInteractiveId.mockReturnValue("linked-interactive-id");

    render(
      <AgentSimulationComponent
        authoredState={defaultAuthoredState}
        interactiveState={defaultInteractiveState}
        setInteractiveState={mockSetInteractiveState}
      />
    );

    const updateButton = screen.getByText("Update Code");
    expect(updateButton).toBeInTheDocument();
    expect(updateButton).toBeDisabled(); // Should be disabled initially with no external code
  });

  it("handles linked interactive state updates", () => {
    mockUseLinkedInteractiveId.mockReturnValue("linked-interactive-id");

    render(
      <AgentSimulationComponent
        authoredState={defaultAuthoredState}
        interactiveState={defaultInteractiveState}
        setInteractiveState={mockSetInteractiveState}
      />
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
    const updateButton = screen.getByText("Update Code");
    expect(updateButton).not.toBeDisabled();
  });

  it("updates blockly code when update button is clicked", () => {
    mockUseLinkedInteractiveId.mockReturnValue("linked-interactive-id");

    render(
      <AgentSimulationComponent
        authoredState={defaultAuthoredState}
        interactiveState={defaultInteractiveState}
        setInteractiveState={mockSetInteractiveState}
      />
    );

    // Simulate receiving new code from linked interactive
    const listenerCall = mockAddLinkedInteractiveStateListener.mock.calls[0];
    const listener = listenerCall[0];
    const newLinkedState = { code: "// Updated blockly code" };

    act(() => {
      listener(newLinkedState);
    });

    // Click update button
    fireEvent.click(screen.getByText("Update Code"));

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
      <AgentSimulationComponent
        authoredState={defaultAuthoredState}
        interactiveState={defaultInteractiveState}
        setInteractiveState={mockSetInteractiveState}
      />
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
      <AgentSimulationComponent
        authoredState={defaultAuthoredState}
        interactiveState={defaultInteractiveState}
        setInteractiveState={mockSetInteractiveState}
      />
    );

    unmount();

    expect(mockRemoveLinkedInteractiveStateListener).toHaveBeenCalled();
    expect(mockSimulation.end).toHaveBeenCalled();

    // Restore original eval
    global.eval = originalEval;
  });

  it("works in report mode", () => {
    // Mock eval to return a simple function that doesn't throw
    const originalEval = global.eval;
    const mockFunction = jest.fn();
    global.eval = jest.fn(() => mockFunction);

    render(
      <AgentSimulationComponent
        authoredState={defaultAuthoredState}
        interactiveState={defaultInteractiveState}
        setInteractiveState={mockSetInteractiveState}
        report={true}
      />
    );

    // Should still render the simulation
    expect(mockSimulationConstructor).toHaveBeenCalled();
    expect(screen.getByText("Reset")).toBeInTheDocument();
    expect(screen.getByText("Play")).toBeInTheDocument();

    // Restore original eval
    global.eval = originalEval;
  });

  it("handles non-string code from linked interactive", () => {
    mockUseLinkedInteractiveId.mockReturnValue("linked-interactive-id");

    render(
      <AgentSimulationComponent
        authoredState={defaultAuthoredState}
        interactiveState={defaultInteractiveState}
        setInteractiveState={mockSetInteractiveState}
      />
    );

    // Simulate receiving invalid code from linked interactive
    const listenerCall = mockAddLinkedInteractiveStateListener.mock.calls[0];
    const listener = listenerCall[0];
    const newLinkedState = { code: null }; // Non-string code

    act(() => {
      listener(newLinkedState);
    });

    // Update button should remain disabled
    const updateButton = screen.getByText("Update Code");
    expect(updateButton).toBeDisabled();
  });

  it("uses existing blockly code from interactive state", () => {
    const stateWithBlocklyCode: IInteractiveState = {
      ...defaultInteractiveState,
      blocklyCode: "// Existing blockly code"
    };

    // Mock eval to capture the function code
    const mockFunction = jest.fn();
    global.eval = jest.fn(() => mockFunction);

    render(
      <AgentSimulationComponent
        authoredState={defaultAuthoredState}
        interactiveState={stateWithBlocklyCode}
        setInteractiveState={mockSetInteractiveState}
      />
    );

    // Verify eval was called with the blockly code, not the authored code
    expect(global.eval).toHaveBeenCalledWith("(sim, AA, AV) => { // Existing blockly code }");
    expect(mockFunction).toHaveBeenCalledWith(mockSimulation, AA, AV);
  });

  it("falls back to authored code when no blockly code exists", () => {
    // Mock eval to capture the function code
    const mockFunction = jest.fn();
    global.eval = jest.fn(() => mockFunction);

    render(
      <AgentSimulationComponent
        authoredState={defaultAuthoredState}
        interactiveState={defaultInteractiveState}
        setInteractiveState={mockSetInteractiveState}
      />
    );

    // Verify eval was called with the authored code
    expect(global.eval).toHaveBeenCalledWith("(sim, AA, AV) => { // Default simulation code }");
    expect(mockFunction).toHaveBeenCalledWith(mockSimulation, AA, AV);
  });
});