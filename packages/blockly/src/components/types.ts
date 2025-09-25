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
  typeLabel?: string;
}

export interface ICreateBlockConfig extends IBlockConfigBase {
  childBlocks?: string[];
  defaultCount?: number;
  maxCount?: number;
  minCount?: number;
  typeOptions?: MenuOption[];
}

export interface ISetBlockConfig extends IBlockConfigBase {
  typeOptions?: MenuOption[];
  includeNumberInput?: boolean;
}

export interface ICustomBlock {
  color: string;
  config: ICreateBlockConfig | ISetBlockConfig;
  id: string;
  name: string;
  type: CustomBlockType;
}

// Predefined custom blocks
// TODO: Determine if it's actually useful to have these.
// export const PREDEFINED_BLOCKS: ICustomBlock[] = [
//   {
//     id: "diffusion-create",
//     type: "creator",
//     name: "Create Diffusion Particles",
//     color: "#312b84",
//     config: {
//       defaultCount: 100,
//       minCount: 0,
//       maxCount: 500,
//       typeLabel: "particles",
//       typeOptions: [
//         ["water", "WATER"],
//         ["ink", "INK"]
//       ]
//     }
//   },
//   {
//     id: "diffusion-set-speed",
//     type: "setter",
//     name: "Set Diffusion Speed",
//     color: "#312b84",
//     config: {
//       typeLabel: "speed",
//       typeOptions: [
//         ["zero", "ZERO"],
//         ["low", "LOW"],
//         ["medium", "MEDIUM"],
//         ["high", "HIGH"],
//         ["initial temperature", "TEMP"]
//       ]
//     }
//   },
//   {
//     id: "photosynthesis-create",
//     type: "creator",
//     name: "Create Photosynthesis Molecules",
//     color: "#4CAF50",
//     config: {
//       defaultCount: 50,
//       minCount: 0,
//       maxCount: 100,
//       typeLabel: "molecules",
//       typeOptions: [
//         ["co2", "CO2"],
//         ["h2o", "H2O"]
//       ]
//     }
//   }
// ];

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

// ,
//       {
//         "kind": "category",
//         "name": "Properties",
//         "colour": "#312b84",
//         "contents": [
//           {
//             "kind": "block",
//             "type": "create"
//           },
//           {
//             "kind": "block",
//             "type": "set_speed"
//           },
//           {
//             "kind": "block",
//             "type": "set_type"
//           }
//         ]
//       }
