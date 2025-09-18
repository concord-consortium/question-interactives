import React from "react";
import { RJSFSchema } from "@rjsf/utils";

import { BaseQuestionApp } from "@concord-consortium/question-interactives-helpers/src/components/base-question-app";
import { Runtime } from "./runtime";
import { IAuthoredState, IInteractiveState } from "./types";

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
      toolbox: {
        title: "Toolbox",
        type: "string"
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
    toolbox: {
      "ui:widget": "textarea",
      "ui:options": {
        "rows": 15
      }
    }
  }
};

const isAnswered = (interactiveState: IInteractiveState | null) => {
  return true;
};

export const App = () => (
  <BaseQuestionApp<IAuthoredState, IInteractiveState>
    Runtime={Runtime}
    baseAuthoringProps={baseAuthoringProps}
    isAnswered={isAnswered}
  />
);
