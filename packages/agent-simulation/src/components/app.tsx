import React from "react";
import { RJSFSchema } from "@rjsf/utils";
import { BaseQuestionApp } from "@concord-consortium/question-interactives-helpers/src/components/base-question-app";

import { predatorPreyCode } from "../sims/predator-prey-model";
import { IAuthoredState, IInteractiveState, defaultMaxRecordingTime, maxMaxRecordingTime } from "./types";
import { Runtime } from "./runtime";
import { migrateAuthoredState } from "./state-migrations";
import { preprocessFormData } from "./authoring-utils";

const baseAuthoringProps = {
  schema: {
    type: "object",
    properties: {
      version: {
        type: "number",
        default: 2
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
      gridHeight: {
        title: "Grid Height",
        type: "number",
        default: 450,
      },
      gridWidth: {
        title: "Grid Width",
        type: "number",
        default: 450,
      },
      gridStep: {
        title: "Grid Step",
        type: "number",
        default: 10,
      },
      maxRecordingTime: {
        title: `Maximum Recording Time (in seconds, max of ${maxMaxRecordingTime})`,
        type: "number",
        minimum: 1,
        maximum: maxMaxRecordingTime,
        default: defaultMaxRecordingTime
      },
      sampleIntervalUnit: {
        title: "Throttle samples by",
        type: "string",
        enum: ["none", "ms", "ticks"],
        enumNames: [
          "No throttling",
          "Every N milliseconds",
          "Every N simulation ticks"
        ],
        default: "none"
      },
      sampleInterval: {
        title: "Interval",
        type: "integer",
        minimum: 1
      },
      maxSamples: {
        title: "Maximum Samples per Recording (optional)",
        type: "number",
        minimum: 1
      },
      code: {
        title: "Simulation Code",
        type: "string",
        default: predatorPreyCode
      },
      dataSourceInteractive: {
        title: "Data Source Interactive",
        type: "string",
        enum: ["none"],
        enumNames: ["No linked interactives available"]
      },
    },
    dependencies: {
      dataSourceInteractive: {
        properties: {
          dataSourceInteractiveName: {
            title: "Data Source Interactive Name",
            type: "string"
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
    gridHeight: {
      "ui:widget": "updown"
    },
    gridWidth: {
      "ui:widget": "updown"
    },
    gridStep: {
      "ui:widget": "updown"
    },
    maxRecordingTime: {
      "ui:widget": "updown"
    },
    sampleInterval: {
      "ui:widget": "updown",
      "ui:help": "Interpreted in the unit selected above. Review this value if you change the unit — for example, 1000 means 1000 milliseconds in ms mode and 1000 simulation ticks in tick mode."
    },
    maxSamples: {
      "ui:widget": "updown"
    },
    code: {
      "ui:widget": "textarea",
      "ui:options": {
        "rows": 15
      }
    }
  },

  preprocessFormData,
};

const isAnswered = (interactiveState: IInteractiveState | null) => true;

export const App = () => (
  <BaseQuestionApp<IAuthoredState, IInteractiveState>
    Runtime={Runtime}
    baseAuthoringProps={baseAuthoringProps}
    isAnswered={isAnswered}
    linkedInteractiveProps={[{ label: "dataSourceInteractive" }]}
    migrateAuthoredState={migrateAuthoredState}
  />
);
