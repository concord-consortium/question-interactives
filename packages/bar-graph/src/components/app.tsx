import React from "react";
import { RJSFSchema } from "@rjsf/utils";
import { BaseQuestionApp } from "@concord-consortium/question-interactives-helpers/src/components/base-question-app";
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
        default: 100,
        minimum: 1
      },
      yAxisCountBy: {
        title: "Y-axis Tick Spacing (this may be ignored if no space is available)",
        type: "number",
        default: 10,
        minimum: 1
      },
      showValuesAboveBars: {
        type: "boolean",
        title: "Show values above bars",
        default: false
      },
      numberOfDecimalPlaces: {
        title: "Number of Decimal Places (Bar Values)",
        type: "number",
        default: 0,
        minimum: 0
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
              minimum: 0
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
  } as RJSFSchema,

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
    maxYValue: {
      "ui:widget": "numberInput"
    },
    yAxisCountBy: {
      "ui:widget": "numberInput"
    },
    numberOfDecimalPlaces: {
      "ui:widget": "numberInput"
    },
    bars: {
      items: {
        "ui:order": [
          "label",
          "value",
          "lockValue",
          "color"
        ],
        value: {
          "ui:widget": "numberInput"
        },
        color: {
          "ui:widget": "color"
        }
      }
    }
  }
};

const isAnswered = (interactiveState: IInteractiveState | null) => {
  // return true if at least one bar has a value
  return !!interactiveState?.barValues?.find(b => b.hasValue);
};

export const App = () => (
  <BaseQuestionApp<IAuthoredState, IInteractiveState>
    Runtime={Runtime}
    baseAuthoringProps={baseAuthoringProps}
    isAnswered={isAnswered}
    supportsInteractiveStateHistory={true}
  />
);
