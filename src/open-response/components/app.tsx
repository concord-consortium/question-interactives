import React from "react";
import { BaseQuestionApp } from "../../shared/components/base-question-app";
import { Runtime } from "./runtime";
import { JSONSchema6 } from "json-schema";
import { IAuthoringOpenResponseMetadata, IRuntimeOpenResponseMetadata } from "@concord-consortium/lara-interactive-api";

// Note that TS interfaces should match JSON schema. Currently there's no way to generate one from the other.
// TS interfaces are not available in runtime in contrast to JSON schema.

export interface IAuthoredState extends IAuthoringOpenResponseMetadata {
  version: number;
  defaultAnswer?: string;
  hint?: string;
}

export interface IInteractiveState extends IRuntimeOpenResponseMetadata {}

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
      predictionFeedback: {
        title: "Prediction feedback (optional)",
        type: "string"
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
    questionType: {
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
