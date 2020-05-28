import React from "react";
import { FormValidation } from "react-jsonschema-form";
import { JSONSchema6 } from "json-schema";
import { BaseQuestionApp } from "../../shared/components/base-question-app";
import { Runtime } from "./runtime";

// Note that TS interfaces should match JSON schema. Currently there's no way to generate one from the other.
// TS interfaces are not available in runtime in contrast to JSON schema.

export const defaultBlankSize = 20; // characters
const blankRegexp = /\[blank-\w+\]/g; // will match [blank-1], [blank-test], [blank-second_option] etc.

export interface IBlankDef {
  id: string;
  size: number;
  matchTerm?: string;
}

export interface IAuthoredState {
  version: number;
  prompt?: string;
  hint?: string;
  blanks?: IBlankDef[];
  required?: boolean;
}

export interface IFilledBlank {
  id: string;
  response: string;
}

export interface IInteractiveState {
  blanks: IFilledBlank[];
  submitted?: boolean;
}

export const baseAuthoringProps = {
  schema: {
    type: "object",
    properties: {
      version: {
        type: "number",
        default: 1
      },
      prompt: {
        title: "Prompt. Provide sentence with one or more blanks specified with [blank-<ID>], for example [blank-1], [blank-test].",
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
      blanks: {
        type: "array",
        title: "Blank field options",
        items: {
          type: "object",
          properties: {
            id: {
              type: "string",
              title: "Blank ID",
              readOnly: true
            },
            size: {
              type: "number",
              title: "Size (number of characters)"
            },
            matchTerm: {
              type: "string",
              title: "Match term"
            }
          }
        }
      }
    }
  } as JSONSchema6,

  uiSchema: {
    version: {
      "ui:widget": "hidden"
    },
    prompt: {
      "ui:widget": "textarea"
    },
    hint: {
      "ui:widget": "textarea"
    },
    blanks: {
      "ui:options":  {
        orderable: false,
        removable: false,
        addable: false
      }
    }
  },

  validate: (formData: IAuthoredState, errors: FormValidation) => {
    if (formData.prompt) {
      const sortedBlanks = (formData?.prompt?.match(blankRegexp) || []).sort();
      for (let i = 0; i < sortedBlanks.length - 1; i++) {
        if (sortedBlanks[i] === sortedBlanks[i + 1]) {
          errors.prompt.addError(`The same blank ID used multiple times: ${sortedBlanks[i]}`);
          return errors;
        }
      }
    }
    return errors;
  },

  preprocessFormData: (authoredState: IAuthoredState) => {
    const blanks = authoredState?.prompt?.match(blankRegexp) || [];
    const newAuthoredState = Object.assign({}, authoredState, { blanks: authoredState?.blanks?.slice() || [] });
    // Check existing blank options and remove ones that are not necessary anymore.
    authoredState.blanks?.forEach(blankOptions => {
      if (!blanks.find(blankId => blankId === blankOptions.id)) {
        // Existing blank options are not matching any keyword in the current prompt. Remove it.
        const idx = newAuthoredState.blanks?.indexOf(blankOptions);
        if (idx !== undefined && idx !== -1) {
          newAuthoredState.blanks.splice(idx, 1);
        }
      }
    });
    // Add new blank options if necessary.
    blanks.forEach(blankId => {
      if (!newAuthoredState.blanks.find(blankOptions => blankOptions.id === blankId)) {
        // New blank keyword found in the prompt. Add a new blank options object.
        newAuthoredState.blanks.push({ id: blankId, size: defaultBlankSize });
      }
    });
    return newAuthoredState;
  }
};

const isAnswered = (interactiveState: IInteractiveState) => (interactiveState?.blanks || []).length > 0;

export const App = () => (
  <BaseQuestionApp<IAuthoredState, IInteractiveState>
    Runtime={Runtime}
    baseAuthoringProps={baseAuthoringProps}
    isAnswered={isAnswered}
  />
);

