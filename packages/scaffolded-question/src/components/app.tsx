import React from "react";
import { BaseQuestionApp } from "@concord-consortium/question-interactives-helpers/src/components/base-question-app";
import { Runtime } from "./runtime";
import { IframeAuthoring } from "./iframe-authoring";
import { IAuthoredState, IInteractiveState } from "./types";
import { migrateAuthoredState } from "./state-migrations";
import { RJSFSchema } from "@rjsf/utils";

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
        title: "Required",
        type: "boolean"
      },
      hint: {
        title: "Hint",
        type: "string"
      },
      subinteractives: {
        type: "array",
        title: "Subquestions",
        items: {
          type: "object",
          properties: {
            id: {
              type: "string"
            },
            libraryInteractiveId: {
              type: "string"
            },
            authoredState: {
              type: "string"
            }
          }
        }
      }
    }
  } as RJSFSchema,

  uiSchema: {
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
    subinteractives: {
      items: {
        "ui:field": "iframeAuthoring"
      }
    }
  },

  fields: {
    iframeAuthoring: IframeAuthoring
  }
};

export const App = () => (
  <BaseQuestionApp<IAuthoredState, IInteractiveState>
    Runtime={Runtime}
    baseAuthoringProps={baseAuthoringProps}
    disableSubmitBtnRendering={true}
    migrateAuthoredState={migrateAuthoredState}
  />
);
