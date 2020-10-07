import React from "react";
import { JSONSchema6 } from "json-schema";
import { BaseQuestionApp } from "../../shared/components/base-question-app";
import { Runtime } from "./runtime";
import {
  baseAuthoringProps as drawingToolBaseAuthoringProps, IAuthoredState as IDrawingToolAuthoredState,
  IInteractiveState as IDrawingToolInteractiveState
} from "../../drawing-tool/components/app";
import deepmerge from "deepmerge";

export interface IAuthoredState extends IDrawingToolAuthoredState {
  answerPrompt?: string;
  defaultAnswer?: string;
  modalSupported?: boolean;
}

export interface IInteractiveState extends IDrawingToolInteractiveState {
  answerText?: string;
}

const baseAuthoringProps = deepmerge(drawingToolBaseAuthoringProps, {
  schema: {
    properties: {
      version: {
        type: "number",
        default: 1
      },
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
      }
    }
  } as JSONSchema6,

  uiSchema: {
    "ui:order": [
      "prompt", "required", "predictionFeedback", "hint", "backgroundSource", "snapshotTarget", "backgroundImageUrl",
      "imageFit", "imagePosition",  "stampCollections", "answerPrompt", "defaultAnswer", "version", "questionType"
    ],
    defaultAnswer: {
      "ui:widget": "textarea"
    }
  }
}, {
  // Just overwrite array, don't merge values.
  arrayMerge: (destinationArray, sourceArray) => sourceArray
});

const isAnswered = (interactiveState: IInteractiveState | null) => !!interactiveState?.answerText;

export const App = () => (
  <BaseQuestionApp<IAuthoredState, IInteractiveState>
    Runtime={Runtime}
    baseAuthoringProps={baseAuthoringProps}
    isAnswered={isAnswered}
    linkedInteractiveProps={[{ label: "snapshotTarget", supportsSnapshots: true }]}
  />
);