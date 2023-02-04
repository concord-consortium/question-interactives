import React from "react";
import { RJSFSchema } from "@rjsf/utils";
import { BaseQuestionApp } from "@concord-consortium/question-interactives-helpers/src/components/base-question-app";
import { IAuthoredState, IInteractiveState } from "./types";
import { Runtime } from "./runtime";
import { IframeAuthoring } from "./iframe-authoring";
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
      division: {
        title: "Division %",
        type: "integer",
        minimum: 10,
        maximum: 90
      },
      leftInteractive: {
        title: "Left interactive",
        type: "object",
        properties: {
          id: {
            type: "string"
          },
          libraryInteractiveId: {
            type: "string"
          },
          authoredState: {
            type: "object"
          },
          navImageUrl: {
            type: "string"
          }
        }
      },
      rightInteractive: {
        type: "object",
        properties: {
          id: {
            type: "string"
          },
          libraryInteractiveId: {
            type: "string"
          },
          authoredState: {
            type: "object"
          },
          navImageUrl: {
            type: "string"
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
    division: {
      "ui:widget": "range"
    },
    leftInteractive: {
      "ui:field": "iframeAuthoring"
    },
    rightInteractive: {
      "ui:field": "iframeAuthoring"
    },
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
  />
);
