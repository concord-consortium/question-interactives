import { CustomBlockType } from "./types";

export interface IBlockTypeConfig {
  canHaveChildren: boolean;
  color: string;
  hasCountFields?: boolean;
  hasConditionInput?: boolean;
  hasGeneratorTemplate: boolean;
  hasLabelPosition?: boolean;
  hasNumberInput?: boolean;
  hasOptions: boolean;
  hasParameters: boolean;
  hasTargetEntity?: boolean;
  hasStatementKind?: boolean;
  includeAllOption?: boolean;
  generatorPlaceholder?: string;
  label: string;
  optionLabelPlaceholder?: string;
  optionTerm?: string;
  optionValuePlaceholder?: string;
  placeholder?: string;
  typeCanHaveChildren?: boolean;
}

export const BLOCK_TYPE_CONFIG: Record<CustomBlockType, IBlockTypeConfig> = {
  action: {
    canHaveChildren: false,
    color: "#004696",
    hasConditionInput: true,
    hasGeneratorTemplate: true,
    hasOptions: false,
    hasParameters: true,
    generatorPlaceholder: "e.g., ${ACTION} ${DIRECTION}\\nset speed ${SPEED}",
    label: "Action Name",
    placeholder: "e.g., bounce off, move forward",
    typeCanHaveChildren: true
  },
  ask: {
    canHaveChildren: false,
    color: "#0089b8",
    hasGeneratorTemplate: false,
    hasOptions: false,
    hasParameters: false,
    hasStatementKind: true,
    hasTargetEntity: true,
    includeAllOption: false,
    generatorPlaceholder: "e.g., custom statement header",
    label: "Name",
    placeholder: ""
  },
  builtIn: {
    canHaveChildren: true,
    color: "#aa42f5",
    hasConditionInput: true,
    hasGeneratorTemplate: false,
    hasOptions: false,
    hasParameters: false,
    label: "Block Name",
  },
  condition: {
    canHaveChildren: false,
    color: "#0089b8",
    generatorPlaceholder: "",
    hasGeneratorTemplate: true,
    hasLabelPosition: true,
    hasOptions: true,
    hasParameters: false,
    hasTargetEntity: true,
    label: "Condition Name",
    placeholder: "e.g., touching, near, with"
  },
  creator: {
    canHaveChildren: true,
    color: "#312b84",
    hasCountFields: true,
    hasGeneratorTemplate: false,
    hasOptions: true,
    hasParameters: false,
    label: "Object Name",
    optionLabelPlaceholder: "Display text (e.g., water)",
    optionTerm: "Types",
    optionValuePlaceholder: "Value (e.g., WATER)",
    placeholder: "e.g., molecules, people",
    typeCanHaveChildren: true
  },
  setter: {
    canHaveChildren: false,
    color: "#312b84",
    hasGeneratorTemplate: false,
    hasNumberInput: true,
    hasOptions: true,
    hasParameters: false,
    label: "Property Name",
    placeholder: "e.g., color, speed"
  }
} as const;
