import { IAuthoringInteractiveMetadata, IRuntimeInteractiveMetadata } from "@concord-consortium/lara-interactive-api";
import { MenuOption } from "blockly";

// Note that TS interfaces should match JSON schema. Currently there's no way to generate one from the other.
// TS interfaces are not available in runtime in contrast to JSON schema.

export type CustomBlockType = "creator" | "setter";

interface IBlockConfigBase {
  generatorTemplate?: string;
  inputsInline?: boolean;
  previousStatement?: boolean;
  nextStatement?: boolean;
}

export interface ICreateBlockConfig extends IBlockConfigBase {
  childBlocks?: string[];
  defaultCount?: number;
  maxCount?: number;
  minCount?: number;
  typeOptions?: MenuOption[];
}

export interface ISetBlockConfig extends IBlockConfigBase {
  includeNumberInput?: boolean;
  typeOptions?: MenuOption[];
}

export interface ICustomBlock {
  category: string; // Toolbox category name
  color: string;
  config: ICreateBlockConfig | ISetBlockConfig;
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
  customBlocks: [],
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
      }
    ]
  }`,
  version: 1
};
