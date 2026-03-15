import React from "react";
import { RJSFSchema } from "@rjsf/utils";
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
      buttonLabel: {
        title: "Button Label (limit: 30 characters)",
        type: "string",
        maxLength: 30
      },
      task: {
        title: "Task",
        type: "string"
      },
      taskParams: {
        title: "Task Parameters (optional)",
        type: "string"
      }
    }
  } as RJSFSchema,

  uiSchema: {
    "ui:order": [
      "prompt",
      "buttonLabel",
      "task",
      "taskParams",
      "*"
    ],
    version: {
      "ui:widget": "hidden"
    },
    questionType: {
      "ui:widget": "hidden"
    },
    prompt: {
      "ui:widget": "richtext",
      "ui:help": "Example: \"Click this button when you have finished answering all the questions.\""
    },
    buttonLabel: {
      "ui:placeholder": "Example: \"I'm Done!\""
    },
    task: {
      "ui:placeholder": "Example: \"success\"",
      "ui:help": "Enter the task name provided by a developer."
    },
    taskParams: {
      "ui:widget": "textarea",
      "ui:options": {
        "rows": 4
      },
      "ui:placeholder": "Example: \"key1=value1\"",
      "ui:help": "Optional parameters as key=value pairs, one per line or single line separated by &."
    }
  }
};

const isAnswered = (interactiveState: IInteractiveState | null) => {
  return true;
};

export const App = () => (
  <BaseQuestionApp<IAuthoredState, IInteractiveState>
    Runtime={Runtime}
    baseAuthoringProps={baseAuthoringProps}
    isAnswered={isAnswered}
  />
);
