import React from "react";
import { JSONSchema6 } from "json-schema";
import { BaseQuestionApp } from "../../shared/components/base-question-app";
import { IRuntimeInteractiveMetadata, IAuthoringInteractiveMetadata } from "@concord-consortium/lara-interactive-api";
import { Runtime } from "./runtime";
import { StampCollection } from "../../drawing-tool/components/app";
import { drawingToolAuthoringProps, stampCollectionDefinition, drawingToolAuthoringSchema } from "../../drawing-tool/components/app";


export interface IAuthoredState extends IAuthoringInteractiveMetadata {
  version: number;
  hint?: string;
  backgroundImageUrl?: string;
  imageFit: string;
  imagePosition: string;
  stampCollections: StampCollection[];
  questionType: "iframe_interactive";
  answerType: string;
  defaultAnswer: string;
}

export interface IInteractiveState extends IRuntimeInteractiveMetadata {
  drawingState: string;
  answerType: "interactive_state";
  answerText: string;
}

const baseAuthoringProps = {
  schema: {
    type: "object",
    definitions: {
      stampCollection: stampCollectionDefinition,
    },
    properties: {
      version: {
        type: "number",
        default: 1
      },
      questionType: {
        type: "string",
        default: "image_question"
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
      defaultAnswer: {
        type: "string",
        title: "Default answer"
      },
      ...drawingToolAuthoringProps
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
      "predictionFeedback",
      "*"
    ],
    hint: {
      "ui:widget": "richtext"
    },
    predictionFeedback: {
      "ui:widget": "richtext"
    },
    defaultAnswer: {
      "ui:widget": "textarea"
    },
    ...drawingToolAuthoringSchema
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
