import { render, screen } from "@testing-library/react";
import React from "react";

import { BlocklyComponent } from "./blockly";
import { IAuthoredState, IInteractiveState } from "./types";

const defaultAuthoredState: IAuthoredState = {
  questionType: "iframe_interactive",
  version: 1,
  toolbox: ""
};

const validToolboxAuthoredState: IAuthoredState = {
  questionType: "iframe_interactive",
  version: 1,
  toolbox: `{
    "kind": "flyoutToolbox",
    "contents": [
      {
        "kind": "block",
        "type": "controls_if"
      },
      {
        "kind": "block",
        "type": "logic_compare"
      }
    ]
  }`
};

const invalidToolboxAuthoredState: IAuthoredState = {
  questionType: "iframe_interactive",
  version: 1,
  toolbox: `{ invalid json }`
};

const defaultInteractiveState: IInteractiveState = {
  answerType: "interactive_state"
};

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
});
