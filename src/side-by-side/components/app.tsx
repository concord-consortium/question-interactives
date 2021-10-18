import React from "react";
import { JSONSchema6 } from "json-schema";
import { BaseQuestionApp } from "../../shared/components/base-question-app";
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
            type: "any"
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
            type: "any"
          },
          navImageUrl: {
            type: "string"
          }
        }
      }
    }
  } as JSONSchema6,

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
