import React from "react";
import { JSONSchema6 } from "json-schema";
import { BaseQuestionApp } from "../../shared/components/base-question-app";
import { Runtime } from "./runtime";
import { v4 as uuidv4 } from "uuid";

// Note that TS interfaces should match JSON schema. Currently there's no way to generate one from the other.
// TS interfaces are not available in runtime in contrast to JSON schema.

export interface IChoice {
  id: string;
  content: string;
  correct?: boolean;
}

// Note that format of this metadata is pretty strict. It needs to match LARA and report-service expectations.
// It can be moved to lara-interactive-api package.
export interface IAuthoringMetadata {
  type: "multiple_choice";
  prompt?: string;
  required?: boolean;
  choices: IChoice[];
}

export interface IAuthoredState extends IAuthoringMetadata {
  version: number;
  hint?: string;
  multipleAnswers?: boolean;
}

// Note that format of this metadata is pretty strict. It needs to match LARA and report-service expectations.
// It can be moved to lara-interactive-api package.
export interface IRuntimeMetadata {
  type: "multiple_choice_answer",
  selectedChoiceIds: string[];
  submitted?: boolean;
}

export interface IInteractiveState extends  IRuntimeMetadata{}

export const baseAuthoringProps = {
  schema: {
    type: "object",
    properties: {
      version: {
        type: "number",
        default: 1
      },
      type: {
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
      hint: {
        title: "Hint",
        type: "string"
      },
      multipleAnswers: {
        type: "boolean",
        title: "Allow multiple answers",
        default: false
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
    type: {
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
