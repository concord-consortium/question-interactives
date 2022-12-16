/*
  This is a modified version of the standard multiple choice question which uses the LARA interactive
  API showModal() function to show feedback via modal alert rather than inline feedback. At this point
  its sole purpose is to allow manual testing of the modal alert functionality.
 */

import React from "react";
import { JSONSchema6 } from "json-schema";
import { BaseQuestionApp } from "@concord-consortium/question-interactives-helpers/src/components/base-question-app";
import { Runtime } from "./runtime";
import { v4 as uuidv4 } from "uuid";
import {
  IAuthoringMultipleChoiceChoiceMetadata, IAuthoringMultipleChoiceMetadata, IRuntimeMultipleChoiceMetadata,
} from "@concord-consortium/lara-interactive-api";

// Note that TS interfaces should match JSON schema. Currently there's no way to generate one from the other.
// TS interfaces are not available in runtime in contrast to JSON schema.

export interface IChoice extends IAuthoringMultipleChoiceChoiceMetadata {
  choiceFeedback?: string;
}

export type ILayout = "vertical" | "horizontal" | "likert" | "dropdown";

export interface IAuthoredState extends IAuthoringMultipleChoiceMetadata {
  version: number;
  hint?: string;
  multipleAnswers?: boolean;
  layout?: ILayout;
  enableCheckAnswer?: boolean;
  customFeedback?: boolean;
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
        title: "Required (Show submit and lock button)",
        type: "boolean"
      },
      enableCheckAnswer: {
        title: "Allow users to check answers",
        type: "boolean",
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
      },
      enableCheckAnswer: {
        oneOf: [
          {
            properties: {
              enableCheckAnswer: {
                enum: [
                  false
                ]
              }
            }
          },
          {
            properties: {
              enableCheckAnswer: {
                enum: [
                  true
                ]
              },
              customFeedback: {
                title: "Show custom feedback for answers",
                type: "boolean"
              }
            }
          }
        ]
      },
      customFeedback: {
        oneOf: [
          {
            properties: {
              customFeedback: {
                enum: [
                  false
                ]
              }
            }
          },
          {
            properties: {
              customFeedback: {
                enum: [
                  true
                ]
              },
              choices: {
                items: {
                  properties: {
                    choiceFeedback: {
                      type: "string",
                      title: "Feedback for choice (optional)"
                    }
                  }
                }
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
      "enableCheckAnswer",
      "customFeedback",
      "*"
    ],
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
