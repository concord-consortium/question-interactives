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
  answerPrompt?: string;
  answerType: string;
  defaultAnswer: string;
  modalSupported?: boolean;
  useSnapshot?: boolean;
  snapshotTarget?: string;
}

export interface IInteractiveState extends IRuntimeInteractiveMetadata {
  drawingState: string;
  answerType: "interactive_state";
  answerText?: string;
  snapshotUrl?: string;
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
      ...drawingToolAuthoringProps,
      answerPrompt: {
        title: "Answer prompt",
        type: "string"
      },
      required: {
        title: "Required (Show submit and lock button)",
        type: "boolean"
      },
      defaultAnswer: {
        type: "string",
        title: "Default answer"
      },
      useSnapshot: {
        title: "Use snapshot button",
        type: "boolean"
      },
      snapshotTarget: {
        title: "Snapshot target",
        type: "string",
        enum: [],
        enumNames: []
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
    prompt: {
      "ui:widget": "richtext"
    },
    predictionFeedback: {
      "ui:widget": "richtext"
    },
    defaultAnswer: {
      "ui:widget": "textarea"
    },
    questionType: {
      "ui:widget": "hidden"
    },
    version: {
      "ui:widget": "hidden"
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
    linkedInteractiveProps={[{ label: "snapshotTarget", supportsSnapshots: true }]}
  />
);
