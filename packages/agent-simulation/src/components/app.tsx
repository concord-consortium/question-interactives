import React from "react";
import { RJSFSchema } from "@rjsf/utils";
import { BaseQuestionApp } from "@concord-consortium/question-interactives-helpers/src/components/base-question-app";

import { predatorPreyCode } from "../sims/predator-prey-model";
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
      }
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
    code: {
      "ui:widget": "textarea",
      "ui:options": {
        "rows": 15
      }
    }
  }
};

const isAnswered = (interactiveState: IInteractiveState | null) => true;

export const App = () => (
  <BaseQuestionApp<IAuthoredState, IInteractiveState>
    Runtime={Runtime}
    baseAuthoringProps={baseAuthoringProps}
    isAnswered={isAnswered}
    linkedInteractiveProps={[{ label: "dataSourceInteractive" }]}
  />
);
