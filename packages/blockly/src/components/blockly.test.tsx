import { render, screen } from "@testing-library/react";
import React from "react";

import { 
  defaultAuthoredState,
  defaultInteractiveState,
  generalToolboxAuthoredState,
  invalidToolboxAuthoredState,
  savedInteractiveState,
  validToolboxAuthoredState
} from "./__mocks__/fixures";
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
  });

  it("renders Blockly when a valid toolbox is provided", () => {
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
});
