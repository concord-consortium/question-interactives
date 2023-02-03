import React from "react";
import { RJSFSchema } from "@rjsf/utils";
import { BaseQuestionApp } from "@concord-consortium/question-interactives-helpers/src/components/base-question-app";
import { Runtime } from "./runtime";
import { IAuthoredState, IInteractiveState } from "./types";
import { v4 as uuidv4 } from "uuid";

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
  } as RJSFSchema,

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
      "ui:widget": "richtext"
    },
    hint: {
      "ui:widget": "richtext"
    },
    predictionFeedback: {
      "ui:widget": "richtext"
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
