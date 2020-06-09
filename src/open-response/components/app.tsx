import React from "react";
import { BaseQuestionApp } from "../../shared/components/base-question-app";
import { Runtime } from "./runtime";
import { JSONSchema6 } from "json-schema";

// Note that TS interfaces should match JSON schema. Currently there's no way to generate one from the other.
// TS interfaces are not available in runtime in contrast to JSON schema.

// Note that format of this metadata is pretty strict. It needs to match LARA and report-service expectations.
// It can be moved to lara-interactive-api package.
export interface IAuthoringMetadata {
  type: "open_response";
  prompt?: string;
  required?: boolean;
}

export interface IAuthoredState extends IAuthoringMetadata {
  version: number;
  defaultAnswer?: string;
  hint?: string;
}

// Note that format of this metadata is pretty strict. It needs to match LARA and report-service expectations.
// It can be moved to lara-interactive-api package.
export interface IRuntimeMetadata {
  type: "open_response_answer",
  answerText?: string;
  submitted?: boolean;
}

export interface IInteractiveState extends IRuntimeMetadata {}

const baseAuthoringProps = {
  schema: {
    type: "object",
    properties: {
      version: {
        type: "number",
        default: 1
      },
      type: {
        type: "string",
        default: "open_response"
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
      defaultAnswer: {
        type: "string",
        title: "Default answer"
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
