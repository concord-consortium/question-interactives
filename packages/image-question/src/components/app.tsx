import React from "react";
import { RJSFSchema } from "@rjsf/utils";
import { BaseQuestionApp } from "@concord-consortium/question-interactives-helpers/src/components/base-question-app";
import { Runtime } from "./runtime";
import { IAuthoredState, IInteractiveState } from "./types";
import { baseAuthoringProps as drawingToolBaseAuthoringProps, exportToMediaLibrary } from "drawing-tool-interactive/src/components/app";
import deepmerge from "deepmerge";

const baseAuthoringProps = deepmerge(drawingToolBaseAuthoringProps, {
  schema: {
    properties: {
      version: {
        type: "number",
        default: 1
      },
      questionType: {
        type: "string",
        default: "image_question"
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
  } as RJSFSchema,

  uiSchema: {
    "ui:order": [
      "prompt", "required", "predictionFeedback", "hint", "backgroundSource", "snapshotTarget", "backgroundImageUrl",
      "imageFit", "imagePosition", "stampCollections", "answerPrompt", "defaultAnswer", "hideDrawingTools", "version", "questionType",
      ...exportToMediaLibrary.uiOrder
    ],
    answerPrompt: {
      "ui:widget": "richtext"
    },
    defaultAnswer: {
      "ui:widget": "textarea"
    }
  }
}, {
  // Just overwrite array, don't merge values.
  arrayMerge: (destinationArray, sourceArray) => sourceArray
});

export const isAnswered = (interactiveState: IInteractiveState | null, authoredState?: IAuthoredState) => {
  const hasInteractiveState = !!interactiveState?.drawingState || !!interactiveState?.userBackgroundImageUrl;
  // if image question has answer prompts they are answered when there is answer text present
  const hasAnswerPrompt = !!authoredState?.answerPrompt;
  const hasAnswerText = !!interactiveState?.answerText;
  return hasInteractiveState && (!hasAnswerPrompt || hasAnswerText);
};

export const App = () => (
  <BaseQuestionApp<IAuthoredState, IInteractiveState>
    Runtime={Runtime}
    baseAuthoringProps={baseAuthoringProps}
    isAnswered={isAnswered}
    linkedInteractiveProps={[{ label: "snapshotTarget", supportsSnapshots: true }]}
  />
);
