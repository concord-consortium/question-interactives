import { IAuthoringInteractiveMetadata, IRuntimeInteractiveMetadata } from "@concord-consortium/lara-interactive-api";
import { MenuOption } from "blockly";

// Note that TS interfaces should match JSON schema. Currently there's no way to generate one from the other.
// TS interfaces are not available in runtime in contrast to JSON schema.

export const VALID_BLOCK_TYPES = ["action", "creator", "setter"] as const;
export const REQUIRED_BLOCK_FIELDS = [
  "category",
  "color",
  "config",
  "id",
  "name",
  "type"
] as const;

export type CustomBlockType = typeof VALID_BLOCK_TYPES[number];
export type ParameterKind = "select" | "number";
export interface IParameterBase {
  defaultValue?: string | number;
  kind: ParameterKind;
  labelPosition?: "prefix" | "suffix";
  labelText?: string;
  name: string;
}
export interface IParameterSelect extends IParameterBase {
  kind: "select";
  options: MenuOption[];
}
export interface IParameterNumber extends IParameterBase {
  kind: "number";
}
export type IParameter = IParameterSelect | IParameterNumber;

interface IBlockConfigBase {
  canHaveChildren?: boolean;
  childBlocks?: string[];
  generatorTemplate?: string;
  inputsInline?: boolean;
  nextStatement?: boolean;
  previousStatement?: boolean;
}

export interface IActionBlockConfig extends IBlockConfigBase {
  parameters?: IParameter[];
}
export interface ICreateBlockConfig extends IBlockConfigBase {
  defaultCount?: number;
  maxCount?: number;
  minCount?: number;
  typeOptions?: MenuOption[];
}

export interface ISetBlockConfig extends IBlockConfigBase {
  canHaveChildren: false;
  includeNumberInput?: boolean;
  typeOptions?: MenuOption[];
}

export const isActionBlockConfig = (config: unknown): config is IActionBlockConfig => {
  return (config as IActionBlockConfig).parameters !== undefined;
};

export const isCreateBlockConfig = (config: unknown): config is ICreateBlockConfig => {
  return (config as ICreateBlockConfig).typeOptions !== undefined && (config as ICreateBlockConfig).canHaveChildren !== false;
};

export const isSetBlockConfig = (config: unknown): config is ISetBlockConfig => {
  return (config as ISetBlockConfig).includeNumberInput !== undefined;
};

export interface ICustomBlock {
  category: string; // Toolbox category name
  color: string;
  config: IActionBlockConfig | ICreateBlockConfig | ISetBlockConfig;
  id: string;
  name: string;
  type: CustomBlockType;
}

export interface IAuthoredState extends IAuthoringInteractiveMetadata {
  customBlocks?: ICustomBlock[];
  hint?: string;
  toolbox: string;
  version: number;
}

export interface IInteractiveState extends IRuntimeInteractiveMetadata {
  blocklyCode?: string;
  blocklyState?: string;
  submitted?: boolean;
}

export const DefaultAuthoredState: Omit<Required<IAuthoredState>, "questionSubType"|"required"|"prompt"> = {
  customBlocks: [],
  hint: "",
  questionType: "iframe_interactive",
  toolbox: "",
  version: 1
};

export const DemoAuthoredState: IAuthoredState = {
  customBlocks: [
     {
       "category": "Properties",
       "color": "#312b84",
       "config": {
         "canHaveChildren": false,
         "inputsInline": true,
         "nextStatement": true,
         "previousStatement": true,
         "typeOptions": [
           ["blue", "BLUE"],
           ["red", "RED"]
         ]
       },
       "id": "custom_setter_color_1759159837671",
       "name": "color",
       "type": "setter"
     },
     {
       "category": "Properties",
       "color": "#312b84",
       "config": {
         "canHaveChildren": true,
         "inputsInline": true,
         "nextStatement": true,
         "previousStatement": true,
         "childBlocks": [
           "custom_setter_color_1759159837671"
         ],
         "typeOptions": [
           ["water", "WATER"],
           ["ink", "INK"]
         ],
         "defaultCount": 100,
         "minCount": 0,
         "maxCount": 500
       },
       "id": "custom_creator_molecules_1759159855002",
       "name": "molecules",
       "type": "creator"
     },
    {
      "category": "Action",
      "color": "#004696",
      "config": {
        "inputsInline": true,
        "nextStatement": true,
        "previousStatement": true,
        "canHaveChildren": false,
        "childBlocks": [],
        "generatorTemplate": "${ACTION}\n",
      },
      "id": "custom_action_bounce_off_1759180886334",
      "name": "bounce off",
      "type": "action"
    },
    {
      "category": "Action",
      "color": "#004696",
      "config": {
        "inputsInline": true,
        "nextStatement": true,
        "previousStatement": true,
        "canHaveChildren": false,
        "childBlocks": [],
        "generatorTemplate": "${ACTION} ${DIRECTION}\nspeed=${MAGNITUDE}\n",
        "parameters": [
          {
            "kind": "select",
            "name": "DIRECTION",
            "labelPosition": "prefix",
            "options": [
              [
                "forward",
                "FORWARD"
              ],
              [
                "backward",
                "BACKWARD"
              ]
            ]
          },
          {
            "kind": "select",
            "name": "MAGNITUDE",
            "labelPosition": "prefix",
            "options": [
              [
                "the same",
                "SAME"
              ],
              [
                "at wind speed",
                "WIND_SPEED"
              ]
            ]
          }
        ]
      },
      "id": "custom_action_move_1759267234848",
      "name": "move",
      "type": "action"
    },
    {
      "category": "Action",
      "color": "#004696",
      "config": {
        "inputsInline": true,
        "nextStatement": true,
        "previousStatement": true,
        "canHaveChildren": false,
        "childBlocks": [],
        "generatorTemplate": "${ACTION} ${MOLECULE}\n",
        "parameters": [
          {
            "kind": "select",
            "name": "MOLECULE",
            "labelPosition": "suffix",
            "options": [
              [
                "co2",
                "CO2"
              ],
              [
                "h2o",
                "H2O"
              ]
            ],
            "labelText": "apart"
          }
        ]
      },
      "id": "custom_action_break_1759267395583",
      "name": "break",
      "type": "action"
    },
    {
      "category": "Action",
      "color": "#004696",
      "config": {
        "inputsInline": true,
        "nextStatement": true,
        "previousStatement": true,
        "canHaveChildren": false,
        "childBlocks": [],
        "generatorTemplate": "${ACTION}\n",
        "parameters": [
          {
            "kind": "number",
            "name": "LEFT",
            "labelPosition": "suffix",
            "labelText": "degrees",
            "defaultValue": 1
          }
        ]
      },
      "id": "custom_action_turn_left_1759267437081",
      "name": "turn left",
      "type": "action"
    },
    {
      "category": "Action",
      "color": "#004696",
      "config": {
        "inputsInline": true,
        "nextStatement": true,
        "previousStatement": true,
        "canHaveChildren": false,
        "childBlocks": [],
        "generatorTemplate": "${ACTION} ${X} ${Y}\n",
        "parameters": [
          {
            "kind": "number",
            "name": "X",
            "labelPosition": "prefix",
            "labelText": "x:"
          },
          {
            "kind": "number",
            "name": "Y",
            "labelPosition": "prefix",
            "labelText": "y:"
          }
        ]
      },
      "id": "custom_action_go_to_1759267501416",
      "name": "go to",
      "type": "action"
    }
  ],
  hint: "",
  prompt: "",
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
      },
      {
        "kind": "category",
        "name": "Action",
        "colour": "#004696",
        "contents": []
      }
    ]
  }`,
  version: 1
};
