import React from "react";
import { JSONSchema6 } from "json-schema";
import { BaseQuestionApp } from "@concord-consortium/question-interactives-helpers/src/components/base-question-app";
import { IAuthoredState, IInteractiveState } from "./types";
import { Runtime } from "./runtime";

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
        title: "Required (Show submit and lock button)",
        type: "boolean",
        default: true
      },
      hint: {
        title: "Hint",
        type: "string"
      },
      defaultAnswer: {
        type: "string",
        title: "Default answer"
      },
      scoreBotItemId: {
        type: "string",
        title: "ScoreBOT Item ID"
      },
      scoreMapping: {
        title: "Score Mapping Text",
        type: "array",
        minItems: 5,
        maxItems: 7,
        items: [
          {
            title: "0",
            type: "string"
          },
          {
            title: "1",
            type: "string"
          },
          {
            title: "2",
            type: "string"
          },
          {
            title: "3",
            type: "string"
          },
          {
            title: "4",
            type: "string"
          },
          {
            title: "5",
            type: "string"
          },
          {
            title: "6",
            type: "string"
          }
        ]
      }
    }
  } as JSONSchema6,

  uiSchema: {
    "ui:order": [
      "prompt",
      "*"
    ],
    version: {
      "ui:widget": "hidden"
    },
    required: {
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
    defaultAnswer: {
      "ui:widget": "textarea"
    },
    scoreMapping: {
      "items": [
        { "ui:widget": "richtext" },
        { "ui:widget": "richtext" },
        { "ui:widget": "richtext" },
        { "ui:widget": "richtext" },
        { "ui:widget": "richtext" },
        { "ui:widget": "richtext" },
        { "ui:widget": "richtext" }
      ],
      "ui:options": {
        addable: false,
        orderable: false,
        removable: false
      }
    }
  }
};

export const App = () => (
  <BaseQuestionApp<IAuthoredState, IInteractiveState>
    Runtime={Runtime}
    baseAuthoringProps={baseAuthoringProps}
    disableSubmitBtnRendering={true}
  />
);
