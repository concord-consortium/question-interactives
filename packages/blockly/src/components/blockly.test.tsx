import { render, screen } from "@testing-library/react";
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

  it("handles custom blocks with enhanced toolbox", () => {
    const { container } = render(<BlocklyComponent
      authoredState={customBlocksAuthoredState}
      interactiveState={defaultInteractiveState}
      setInteractiveState={() => {
        // mock implementation
      }}
      report={false}
    />);
    
    // The enhanced toolbox should include custom blocks
    expect(document.querySelector(".injectionDiv")).toBeInTheDocument();
    
    // Custom blocks should be available in the toolbox
    // Note: This is a basic test - in a real scenario, we'd need to mock Blockly more thoroughly
    // to test that custom blocks are actually registered and available
  });
});
