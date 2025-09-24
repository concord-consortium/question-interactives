import { IAuthoringInteractiveMetadata, IRuntimeInteractiveMetadata } from "@concord-consortium/lara-interactive-api";

// Note that TS interfaces should match JSON schema. Currently there's no way to generate one from the other.
// TS interfaces are not available in runtime in contrast to JSON schema.

export interface IAuthoredState extends IAuthoringInteractiveMetadata {
  hint?: string;
  version: number;
  toolbox: string;
}

export interface IInteractiveState extends IRuntimeInteractiveMetadata {
  blocklyState?: string;
  submitted?: boolean;
}

export const DefaultAuthoredState: Omit<Required<IAuthoredState>, "questionSubType"|"required"|"prompt"> = {
  hint: "",
  questionType: "iframe_interactive",
  toolbox: "",
  version: 1
};

export const DemoAuthoredState: IAuthoredState = {
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
        "contents": [
          {
            "kind": "block",
            "type": "create"
          },
          {
            "kind": "block",
            "type": "set_speed"
          },
          {
            "kind": "block",
            "type": "set_type"
          }
        ]
      }
    ]
  }`,
  version: 1
};
