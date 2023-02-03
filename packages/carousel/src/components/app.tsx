import React from "react";
import { RJSFSchema, FormValidation } from "@rjsf/utils";
import { BaseQuestionApp } from "@concord-consortium/question-interactives-helpers/src/components/base-question-app";
import { IAuthoredState, IInteractiveState } from "./types";
import { Runtime } from "./runtime";
import { IframeAuthoring } from "./iframe-authoring";
import { migrateAuthoredState } from "./state-migrations";

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
      required: {
        title: "Required",
        type: "boolean"
      },
      hint: {
        title: "Hint",
        type: "string"
      },
      subinteractives: {
        type: "array",
        title: "Subquestions",
        items: {
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
    hint: {
      "ui:widget": "richtext"
    },
    subinteractives: {
      items: {
        "ui:field": "iframeAuthoring"
      }
    }
  },

  fields: {
    iframeAuthoring: IframeAuthoring
  },

  validate: (formData: IAuthoredState, errors: FormValidation) => {
    formData.subinteractives?.forEach((subinteractive, index) => {
      if (subinteractive.authoredState?.required) {
        errors.required?.addError(`Subquestion ${index + 1} is marked as required. Please use the top-level "Required" checkbox only.`);
      }
    });
    return errors;
  }
};

const isAnswered = (state: IInteractiveState) =>
  state?.subinteractiveStates && Object.values(state.subinteractiveStates).filter(subState => subState !== null).length > 0;

export const App = () => (
  <BaseQuestionApp<IAuthoredState, IInteractiveState>
    Runtime={Runtime}
    baseAuthoringProps={baseAuthoringProps}
    isAnswered={isAnswered}
    migrateAuthoredState={migrateAuthoredState}
  />
);
