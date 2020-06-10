import React from "react";
import { JSONSchema6 } from "json-schema";
import { BaseQuestionApp } from "../../shared/components/base-question-app";
import { Runtime } from "./runtime";
import { IframeAuthoring } from "./iframe-authoring";

// Note that TS interfaces should match JSON schema. Currently there's no way to generate one from the other.
// TS interfaces are not available in runtime in contrast to JSON schema.

// Note that format of this metadata is pretty strict. It needs to match LARA and report-service expectations.
// It can be moved to lara-interactive-api package.
export interface IAuthoringMetadata {
  questionType: "iframe_interactive";
  prompt?: string;
  required?: boolean;
}

export interface IAuthoredState extends IAuthoringMetadata {
  version: number;
  hint?: string;
  subinteractives?: {
    id: string;
    url: string;
    authoredState: any;
  }[]
}

// Note that format of this metadata is pretty strict. It needs to match LARA and report-service expectations.
// It can be moved to lara-interactive-api package.
export interface IRuntimeMetadata {
  answerType: "interactive_state",
  answerText?: string;
}

export interface IInteractiveState extends IRuntimeMetadata {
  subinteractiveStates: {
    [id: string]: any;
  },
  currentSubinteractiveId: string;
  submitted: boolean;
}

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
            url: {
              type: "string"
            },
            authoredState: {
              type: "any"
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
    questionType: {
      "ui:widget": "hidden"
    },
    prompt: {
      "ui:widget": "textarea"
    },
    hint: {
      "ui:widget": "textarea"
    },
    subinteractives: {
      items: {
        "ui:field": "iframeAuthoring"
      }
    }
  },

  fields: {
    iframeAuthoring: IframeAuthoring
  }
};

export const App = () => (
  <BaseQuestionApp<IAuthoredState, IInteractiveState>
    Runtime={Runtime}
    baseAuthoringProps={baseAuthoringProps}
    disableSubmitBtnRendering={true}
  />
);
