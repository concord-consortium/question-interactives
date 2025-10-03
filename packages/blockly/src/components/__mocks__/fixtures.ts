import { IAuthoredState, IBlockConfig, IInteractiveState } from "../types";

export const defaultAuthoredState: IAuthoredState = {
  questionType: "iframe_interactive",
  toolbox: "",
  version: 1,
  customBlocks: []
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
  version: 1,
  customBlocks: []
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
      },
      {
        "kind": "category",
        "name": "Properties",
        "colour": "#312b84",
        "contents": []
      }
    ]
  }`,
  version: 1,
  customBlocks: []
};

export const customBlocksAuthoredState: IAuthoredState = {
  questionType: "iframe_interactive",
  toolbox: `{
    "kind": "categoryToolbox",
    "contents": [
      {
        "kind": "category",
        "name": "General",
        "colour": "#00836B",
        "contents": []
      },
      {
        "kind": "category",
        "name": "Properties",
        "colour": "#312b84",
        "contents": []
      }
    ]
  }`,
  version: 1,
  customBlocks: [
    {
      id: "custom_set_color_1234567890",
      type: "setter",
      name: "color",
      color: "#FF0000",
      category: "Properties",
      config: {
        typeOptions: [["red", "RED"], ["blue", "BLUE"]]
      } as IBlockConfig
    },
    {
      id: "custom_create_molecules_1234567891",
      type: "creator",
      name: "molecules",
      color: "#00FF00",
      category: "General",
      config: {
        childBlocks: ["custom_set_color_1234567890"],
        defaultCount: 100,
        minCount: 0,
        maxCount: 500,
        typeOptions: [["water", "WATER"], ["air", "AIR"]]
      } as IBlockConfig
    }
  ]
};

export const invalidToolboxAuthoredState: IAuthoredState = {
  questionType: "iframe_interactive",
  toolbox: `{ invalid json }`,
  version: 1,
  customBlocks: []
};

export const defaultInteractiveState: IInteractiveState = {
  answerType: "interactive_state"
};

export const savedInteractiveState: IInteractiveState = {
  answerType: "interactive_state",
  blocklyState: "{\"blocks\":{\"languageVersion\":0,\"blocks\":[{\"type\":\"controls_if\",\"id\":\"q`Ro8GQ~afGcY*z`U?%,\",\"x\":30,\"y\":11}]}}"
};
