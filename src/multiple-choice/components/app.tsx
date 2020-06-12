import React from "react";
import { JSONSchema6 } from "json-schema";
import { BaseQuestionApp } from "../../shared/components/base-question-app";
import { Runtime } from "./runtime";
import { v4 as uuidv4 } from "uuid";
import {
  IAuthoringMultipleChoiceChoiceMetadata, IAuthoringMultipleChoiceMetadata, IRuntimeMultipleChoiceMetadata,
} from "@concord-consortium/lara-interactive-api";

// Note that TS interfaces should match JSON schema. Currently there's no way to generate one from the other.
// TS interfaces are not available in runtime in contrast to JSON schema.

export interface IChoice extends IAuthoringMultipleChoiceChoiceMetadata {}

export type ILayout = "vertical" | "horizontal" | "likert" | "dropdown";

export interface IAuthoredState extends IAuthoringMultipleChoiceMetadata {
  version: number;
  hint?: string;
  multipleAnswers?: boolean;
  layout?: ILayout;
  choices: IChoice[];
}

export interface IInteractiveState extends IRuntimeMultipleChoiceMetadata {}

export const baseAuthoringProps = {
  schema: {
    type: "object",
    properties: {
      version: {
        type: "number",
        default: 1
      },
      questionType: {
        type: "string",
        default: "multiple_choice"
      },
      prompt: {
        title: "Prompt",
        type: "string"
      },
      required: {
        title: "Required",
        type: "boolean"
      },
      predictionFeedback: {
        title: "Prediction feedback (optional)",
        type: "string"
      },
      hint: {
        title: "Hint",
        type: "string"
      },
      multipleAnswers: {
        type: "boolean",
        title: "Allow multiple answers",
        default: false
      },
      layout: {
        title: "Layout",
        type: "string",
        default: "vertical",
        enum: [
          "vertical",
          "horizontal",
          "likert",
          "dropdown"
        ],
        enumNames: [
          "Vertical",
          "Horizontal",
          "Likert",
          "Dropdown"
        ]
      },
      choices: {
        type: "array",
        title: "Choices",
        items: {
          type: "object",
          properties: {
            id: {
              type: "string"
            },
            content: {
              type: "string",
              title: "Choice text",
              default: "choice"
            },
            correct: {
              type: "boolean",
              title: "Correct",
              default: false
            }
          }
        },
        default: [
          {
            id: "1",
            content: "Choice A",
            correct: false
          },
          {
            id: "2",
            content: "Choice B",
            correct: false
          },
          {
            id: "3",
            content: "Choice C",
            correct: false
          }
        ]
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
      "ui:widget": "textarea"
    },
    hint: {
      "ui:widget": "textarea"
    },
    choices: {
      items: {
        id: {
          "ui:widget": "hidden"
        }
      }
    }
  },

  preprocessFormData: (authoredState: IAuthoredState) => {
    // Generate choice ID if necessary.
    authoredState.choices?.forEach(choice => {
      if (choice.id === undefined) {
        choice.id = uuidv4();
      }
    });
    return authoredState;
  }
};

const isAnswered = (interactiveState: IInteractiveState) => interactiveState?.selectedChoiceIds?.length > 0;

export const App = () => (
  <BaseQuestionApp<IAuthoredState, IInteractiveState>
    Runtime={Runtime}
    baseAuthoringProps={baseAuthoringProps}
    isAnswered={isAnswered}
  />
);
