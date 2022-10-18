import React from "react";
import { JSONSchema6 } from "json-schema";
import { BaseQuestionApp } from "../../shared/components/base-question-app";
import { IAuthoredState, IInteractiveState } from "./types";
import { Runtime } from "./runtime";

const baseAuthoringProps = {
  schema: {
    type: "object",
    properties: {
      version: {
        type: "number",
        default: 1
      },
      questionType: {
        type: "string",
        default: "iframe_interactive"
      },
      prompt: {
        title: "Prompt",
        type: "string"
      },
      required: {
        title: "Required (Show submit and lock button)",
        type: "boolean"
      },
      hint: {
        title: "Hint",
        type: "string"
      },
      title: {
        title: "Graph Title",
        type: "string"
      },
      xAxisLabel: {
        title: "X-axis Label",
        type: "string"
      },
      yAxisLabel: {
        title: "Y-axis Label",
        type: "string"
      },
      yAxisOrientation: {
        title: "Y-axis Text Orientation",
        type: "string",
        default: "horizontal",
        enum: [
          "horizontal",
          "vertical"
        ],
        enumNames: [
          "Horizontal",
          "Vertical"
        ]
      },
      maxYValue: {
        title: "Y-axis Max Value",
        type: "number",
        default: 100
      },
      yAxisCountBy: {
        title: "Y-axis Tick Spacing (this may be ignored if no space is available)",
        type: "number",
        default: 10
      },
      showValuesAboveBars: {
        type: "boolean",
        title: "Show values above bars",
        default: false
      },
      numberOfDecimalPlaces: {
        title: "Number of Decimal Places (Bar Values)",
        type: "number",
        default: 0
      },
      bars: {
        type: "array",
        title: "Bars",
        items: {
          type: "object",
          properties: {
            label: {
              title: "Bar Label (x-axis)",
              type: "string"
            },
            value: {
              title: "Pre-defined bar value",
              type: "number",
            },
            lockValue: {
              type: "boolean",
              title: "Lock pre-defined value (user cannot edit this bar)",
              default: false
            },
            color: {
              title: "Bar Color",
              type: "string",
              default: "#0592AF"
            }
          }
        }
      }
    }
  } as JSONSchema6,

  uiSchema: {
    "ui:order": [
      "prompt",
      "required",
      "*"
    ],
    version: {
      "ui:widget": "hidden"
    },
    questionType: {
      "ui:widget": "hidden"
    },
    prompt: {
      "ui:widget": "richtext"
    },
    hint: {
      "ui:widget": "richtext"
    },
    bars: {
      items: {
        "ui:order": [
          "label",
          "value",
          "lockValue",
          "color"
        ],
        color: {
          "ui:widget": "color"
        }
      }
    }
  }
};

const isAnswered = (interactiveState: IInteractiveState | null) => false; // TODO

export const App = () => (
  <BaseQuestionApp<IAuthoredState, IInteractiveState>
    Runtime={Runtime}
    baseAuthoringProps={baseAuthoringProps}
    isAnswered={isAnswered}
  />
);
