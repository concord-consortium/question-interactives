import { render, screen, waitFor } from "@testing-library/react";
import React from "react";

import {
  customBlocksAuthoredState,
  defaultAuthoredState,
  defaultInteractiveState,
  generalToolboxAuthoredState,
  invalidToolboxAuthoredState,
  savedInteractiveState,
  validToolboxAuthoredState
} from "./__mocks__/fixtures";
import { BlocklyComponent } from "./blockly";

describe("BlocklyComponent", () => {
  it("shows error message when no toolbox is provided", () => {
    render(<BlocklyComponent
      authoredState={defaultAuthoredState}
      interactiveState={defaultInteractiveState}
      setInteractiveState={() => {
        // mock implementation
      }}
      report={false}
    />);

    expect(screen.getByText(/Enter a toolbox configuration to see Blockly./)).toBeInTheDocument();
    expect(document.querySelector(".injectionDiv")).not.toBeInTheDocument();
    expect(document.querySelector(".go.blocklyNotDeletable")).not.toBeInTheDocument();
    expect(document.querySelector(".setup.blocklyNotDeletable")).not.toBeInTheDocument();
    expect(document.querySelector(".onclick.blocklyNotDeletable")).not.toBeInTheDocument();
  });

  it("renders Blockly with default, not-deletable blocks when a valid toolbox is provided", () => {
    render(<BlocklyComponent
      authoredState={validToolboxAuthoredState}
      interactiveState={defaultInteractiveState}
      setInteractiveState={() => {
        // mock implementation
      }}
      report={false}
    />);
    expect(screen.queryByText(/Enter a toolbox configuration to see Blockly./)).not.toBeInTheDocument();
    expect(screen.queryByText(/Error loading Blockly:/)).not.toBeInTheDocument();
    expect(document.querySelector(".injectionDiv")).toBeInTheDocument();
    expect(document.querySelector(".go.blocklyNotDeletable")).toBeInTheDocument();
    expect(document.querySelector(".setup.blocklyNotDeletable")).toBeInTheDocument();
    expect(document.querySelector(".onclick.blocklyNotDeletable")).toBeInTheDocument();
  });

  it("shows error message when an invalid toolbox is provided", () => {
    render(<BlocklyComponent
      authoredState={invalidToolboxAuthoredState}
      interactiveState={defaultInteractiveState}
      setInteractiveState={() => {
        // mock implementation
      }}
      report={false}
    />);
    expect(screen.getByText(/Error loading Blockly:/)).toBeInTheDocument();
    expect(screen.queryByText(/Enter a toolbox configuration to see Blockly./)).not.toBeInTheDocument();
    expect(document.querySelector(".injectionDiv")).not.toBeInTheDocument();
  });

  it("loads saved state on initial load", () => {
    // Make sure the block is not present if it's not in the saved state
    const { container: noStateContainer } = render(<BlocklyComponent
      authoredState={generalToolboxAuthoredState}
      interactiveState={defaultInteractiveState}
      setInteractiveState={() => {
        // mock implementation
      }}
      report={false}
    />);
    const noStateIfBlock = noStateContainer.querySelector('g.controls_if');
    expect(noStateIfBlock).not.toBeInTheDocument();

    // But the block is present if it is in the saved state
    const { container } = render(<BlocklyComponent
      authoredState={generalToolboxAuthoredState}
      interactiveState={savedInteractiveState}
      setInteractiveState={() => {
        // mock implementation
      }}
      report={false}
    />);
    const ifBlockElement = container.querySelector('g.controls_if');
    expect(ifBlockElement).toBeInTheDocument();
  });

  it("renders with custom blocks in toolbox", () => {
    render(<BlocklyComponent
      authoredState={customBlocksAuthoredState}
      interactiveState={defaultInteractiveState}
      setInteractiveState={() => {
        // mock implementation
      }}
      report={false}
    />);
    
    expect(screen.queryByText(/Enter a toolbox configuration to see Blockly./)).not.toBeInTheDocument();
    expect(screen.queryByText(/Error loading Blockly:/)).not.toBeInTheDocument();
    expect(document.querySelector(".injectionDiv")).toBeInTheDocument();
  });

  it("renders orphan blocks as disabled", async () => {
    // saved state with an orphaned controls_if block
    const stateWithOrphanBlock = {
      ...defaultInteractiveState,
      blocklyState: JSON.stringify({
        blocks: {
          languageVersion: 0,
          blocks: [
            // top-level setup block that should be enabled
            { type: "setup", x: 10, y: 10, deletable: false },
            // orphaned controls_if block that should be disabled
            { 
              type: "controls_if", 
              id: "orphan-block",
              x: 300, 
              y: 300,
            }
          ]
        }
      })
    };

    const { container } = render(<BlocklyComponent
      authoredState={customBlocksAuthoredState}
      interactiveState={stateWithOrphanBlock}
      setInteractiveState={() => {
        // mock implementation
      }}
      report={false}
    />);

    await waitFor(() => {
      const workspaceElement = container.querySelector('.injectionDiv');
      expect(workspaceElement).toBeInTheDocument();

      // Verify orphaned controls_if block is disabled.
      const orphanedIfBlock = container.querySelector('.controls_if');
      expect(orphanedIfBlock).toBeInTheDocument();
      expect(orphanedIfBlock?.classList.contains('blocklyDisabled')).toBeTruthy();

      // Verify top-level setup block is not disabled.
      const setupBlock = container.querySelector('.setup');
      expect(setupBlock).toBeInTheDocument();
      expect(setupBlock?.classList.contains('blocklyDisabled')).toBe(false);
    });
  });

  it("renders connected blocks as enabled", async () => {
    // saved state with a controls_if block nested inside a top-level setup block
    const stateWithConnectedBlock = {
      ...defaultInteractiveState,
      blocklyState: JSON.stringify({
        blocks: {
          languageVersion: 0,
          blocks: [
            // top-level setup block with a nested controls_if block
            { 
              type: "setup", 
              x: 10, 
              y: 10, 
              deletable: false,
              id: "setup-block",
              inputs: {
                "statements": {
                  block: {
                    type: "controls_if",
                    id: "connected-if-block"
                  }
                }
              }
            },
            { type: "go", x: 10, y: 80, deletable: false }
          ]
        }
      })
    };

    const { container } = render(<BlocklyComponent
      authoredState={customBlocksAuthoredState}
      interactiveState={stateWithConnectedBlock}
      setInteractiveState={() => {
        // mock implementation
      }}
      report={false}
    />);

    await waitFor(() => {
      const workspaceElement = container.querySelector('.injectionDiv');
      expect(workspaceElement).toBeInTheDocument();

      // Verify nested controls_if block is not disabled.
      const connectedIfBlock = container.querySelector('.controls_if');
      expect(connectedIfBlock).toBeInTheDocument();
      expect(connectedIfBlock?.classList.contains('blocklyDisabled')).toBe(false);
      expect(connectedIfBlock?.closest('.blocklyDisabled')).toBeNull();

      // Verify top-level setup block is also not disabled.
      const setupBlock = container.querySelector('.setup');
      expect(setupBlock).toBeInTheDocument();
      expect(setupBlock?.classList.contains('blocklyDisabled')).toBe(false);
    });
  });
});
