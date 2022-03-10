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
  } as JSONSchema6,

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

const isAnswered = (interactiveState: IInteractiveState | null) => !!interactiveState?.answerText;

export const App = () => (
  <BaseQuestionApp<IAuthoredState, IInteractiveState>
    Runtime={Runtime}
    baseAuthoringProps={baseAuthoringProps}
    isAnswered={isAnswered}
  />
);
