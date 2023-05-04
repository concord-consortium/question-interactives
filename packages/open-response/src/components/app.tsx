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
        default: "open_response"
      },
      prompt: {
        title: "Prompt",
        type: "string"
      },
      required: {
        title: "Required (Show submit and lock button)",
        type: "boolean"
      },
      audioEnabled: {
        title: "Allow students to record audio response",
        type: "boolean"
      },
      voiceTypingEnabled: {
        title: "Allow students to use voice typing (Only available to students on certain browsers)",
        type: "boolean"
      },
      hint: {
        title: "Hint",
        type: "string"
      },
      defaultAnswer: {
        type: "string",
        title: "Default answer"
      }
    },
    dependencies: {
      required: {
        oneOf: [
          {
            properties: {
              required: {
                enum: [
                  false
                ]
              }
            }
          },
          {
            properties: {
              required: {
                enum: [
                  true
                ]
              },
              predictionFeedback: {
                title: "Post-submission feedback (optional)",
                type: "string"
              }
            }
          }
        ]
      }
    }
  } as RJSFSchema,

  uiSchema: {
    "ui:order": [
      "prompt",
      "required",
      "audioEnabled",
      "predictionFeedback",
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
    predictionFeedback: {
      "ui:widget": "richtext"
    },
    defaultAnswer: {
      "ui:widget": "textarea"
    },
  }
};

const isAnswered = (interactiveState: IInteractiveState | null) => !!interactiveState?.answerText || !!interactiveState?.audioFile;

export const App = () => (
  <BaseQuestionApp<IAuthoredState, IInteractiveState>
    Runtime={Runtime}
    baseAuthoringProps={baseAuthoringProps}
    isAnswered={isAnswered}
  />
);
