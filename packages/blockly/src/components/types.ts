import { IAuthoringInteractiveMetadata, IRuntimeInteractiveMetadata } from "@concord-consortium/lara-interactive-api";
import { MenuOption, serialization } from "blockly";

import { predatorPreyCode } from "../sims/predator-prey-string";

// Note that TS interfaces should match JSON schema. Currently there's no way to generate one from the other.
// TS interfaces are not available in runtime in contrast to JSON schema.

export const VALID_BLOCK_TYPES = [
  "action",
  "ask",
  "builtIn",
  "condition",
  "creator",
  "globalValue",
  "setter"
] as const;
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

export interface INestedBlock {
  blockId: string;
  canHaveChildren?: boolean;
  children?: INestedBlock[];
  defaultOptionValue?: string;
}

export interface IParameterBase {
  defaultValue?: string | number;
  kind: ParameterKind;
  labelPosition?: "prefix" | "suffix";
  labelText?: string;
  name: string;
}
export interface IParameterSelect extends IParameterBase {
  defaultOptionValue?: string;
  kind: "select";
  options: { label: string; value: string }[];
}
export interface IParameterNumber extends IParameterBase {
  kind: "number";
}
export type IParameter = IParameterSelect | IParameterNumber;

export type GlobalValueType = "number" | "string";

export interface IBlockConfig {
  canHaveChildren: boolean;
  childBlocks?: INestedBlock[]; // DEPRECATED
  childBlocksTemplate?: serialization.blocks.State;
  conditionInput?: boolean;
  defaultCount?: number;
  defaultOptionValue?: string;
  generatorTemplate?: string;
  globalName?: string; // For globalValue blocks: the key used with globals.get()
  globalValueType?: GlobalValueType; // For globalValue blocks: the output type
  includeAllOption?: boolean;
  includeNumberInput?: boolean;
  inputsInline?: boolean;
  labelPosition?: "prefix" | "suffix";
  maxCount?: number;
  minCount?: number;
  nextStatement?: boolean;
  options?: MenuOption[];
  parameters?: IParameter[];
  previousStatement?: boolean;
  showTargetEntityLabel?: boolean;
  targetEntity?: string;
  typeOptions?: MenuOption[];
}

export interface ICustomBlock {
  category: string; // Toolbox category name
  color: string;
  config: IBlockConfig;
  id: string;
  name: string;
  type: CustomBlockType;
}

export interface IBuiltInBlockInfo {
  canHaveChildren: boolean;
  color: string;
  defaultCategory?: string;
  description: string;
  hasStatements: boolean;
  id: string;
  name: string;
  toolboxConfig?: object;
  type: "built-in";
}

export interface IAuthoredState extends IAuthoringInteractiveMetadata {
  customBlocks?: ICustomBlock[];
  hint?: string;
  simulationCode: string;
  toolbox: string;
  version: number;
}

export interface ISavedBlocklyState {
  name: string;
  blocklyState: string;
}

export interface IInteractiveState extends IRuntimeInteractiveMetadata {
  name?: string;
  code?: string;
  blocklyState?: string;
  submitted?: boolean;
  savedBlocklyStates?: ISavedBlocklyState[];
}

const defaultToolbox = {
    "kind": "categoryToolbox",
    "name": "General",
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
      },
      {
        "kind": "category",
        "name": "Action",
        "colour": "#004696",
        "contents": []
      },
      {
        "kind": "category",
        "name": "Controls",
        "colour": "#0089b8",
        "contents": []
      }
    ]
  };

export const DefaultAuthoredState: Omit<Required<IAuthoredState>, "questionSubType"|"required"|"prompt"> = {
  customBlocks: [],
  hint: "",
  questionType: "iframe_interactive",
  simulationCode: predatorPreyCode,
  toolbox: defaultToolbox ? JSON.stringify(defaultToolbox, null, 2) : "",
  version: 1
};

export const DemoAuthoredState: IAuthoredState = {
  customBlocks: [
    {
      category: "Properties",
      color: "#312b84",
      config: {
        canHaveChildren: false,
        inputsInline: true,
        nextStatement: true,
        previousStatement: true,
        typeOptions: [
          ["blue", "BLUE"],
          ["red", "RED"]
        ]
      },
      id: "custom_setter_color_1759159837671",
      name: "color",
      type: "setter"
    },
    {
      category: "Properties",
      color: "#312b84",
      config: {
        canHaveChildren: true,
        inputsInline: true,
        nextStatement: true,
        previousStatement: true,
        childBlocks: [
          {
            blockId: "custom_setter_color_1759159837671"
          }
        ],
        typeOptions: [
          ["water", "WATER"],
          ["ink", "INK"]
        ],
        defaultCount: 100,
        minCount: 0,
        maxCount: 500
      },
      id: "custom_creator_molecules_1759159855002",
      name: "molecules",
      type: "creator"
    },
    {
      category: "Action",
      color: "#004696",
      config: {
        inputsInline: true,
        nextStatement: true,
        previousStatement: true,
        canHaveChildren: false,
        childBlocks: [],
        generatorTemplate: "${ACTION} ${DIRECTION}\nspeed=${MAGNITUDE}\n",
        parameters: [
          {
            kind: "select",
            name: "DIRECTION",
            labelPosition: "prefix",
            options: [
              { label: "forward", value: "FORWARD" },
              { label: "backward", value: "BACKWARD" }
            ]
          },
          {
            kind: "select",
            name: "MAGNITUDE",
            labelPosition: "prefix",
            options: [
              { label: "the same", value: "SAME" },
              { label: "at wind speed", value: "WIND_SPEED" }
            ]
          }
        ]
      },
      id: "custom_action_move_1759267234848",
      name: "move",
      type: "action"
    }
  ],
  hint: "",
  prompt: "",
  questionType: "iframe_interactive",
  simulationCode: predatorPreyCode,
  toolbox: defaultToolbox ? JSON.stringify(defaultToolbox, null, 2) : "",
  version: 1
};
