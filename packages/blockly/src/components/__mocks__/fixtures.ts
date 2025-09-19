import { IAuthoredState, IInteractiveState } from "../types";

export const defaultAuthoredState: IAuthoredState = {
  questionType: "iframe_interactive",
  toolbox: "",
  version: 1
};

export const validToolboxAuthoredState: IAuthoredState = {
  questionType: "iframe_interactive",
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
  }`,
  version: 1
};

export const generalToolboxAuthoredState: IAuthoredState = {
  questionType: "iframe_interactive",
  toolbox: `{
    "kind": "categoryToolbox",
    "name": "General",
    "contents": [
      {
        "kind": "category",
        "name": "General",
        "colour": "#00836B",
        "contents": [
          {
            "kind": "block",
            "type": "controls_if"
          },
          {
            "kind": "block",
            "type": "logic_operation"
          },
          {
            "kind": "block",
            "type": "logic_negate"
          }
        ]
      }
    ]
  }`,
  version: 1
};

export const invalidToolboxAuthoredState: IAuthoredState = {
  questionType: "iframe_interactive",
  toolbox: `{ invalid json }`,
  version: 1
};

export const defaultInteractiveState: IInteractiveState = {
  answerType: "interactive_state"
};

export const savedInteractiveState: IInteractiveState = {
  answerType: "interactive_state",
  blocklyState: "{\"blocks\":{\"languageVersion\":0,\"blocks\":[{\"type\":\"controls_if\",\"id\":\"q`Ro8GQ~afGcY*z`U?%,\",\"x\":30,\"y\":11}]}}"
};
