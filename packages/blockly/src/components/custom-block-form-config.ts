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
  generatorPlaceholder?: string;
  label: string;
  placeholder: string;
}

export const BLOCK_TYPE_CONFIG: Record<CustomBlockType, IBlockTypeConfig> = {
  action: {
    canHaveChildren: true,
    color: "#004696",
    hasGeneratorTemplate: true,
    hasOptions: false,
    hasParameters: true,
    generatorPlaceholder: "e.g., ${ACTION} ${DIRECTION}\\nset speed ${SPEED}",
    label: "Action Name",
    placeholder: "e.g., bounce off, move forward"
  },
  condition: {
    canHaveChildren: false,
    color: "#0089b8",
    hasGeneratorTemplate: false,
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
    placeholder: "e.g., molecules, people"
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
  },
  statement: {
    canHaveChildren: false,
    color: "#0089b8",
    hasConditionInput: true,
    hasGeneratorTemplate: false,
    hasOptions: false,
    hasParameters: false,
    hasStatementKind: true,
    hasTargetEntity: true,
    generatorPlaceholder: "e.g., custom statement header",
    label: "Statement Name",
    placeholder: "e.g., ask, repeat, when"
  }
} as const;
