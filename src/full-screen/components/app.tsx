import React from "react";
import { JSONSchema6 } from "json-schema";
import { BaseQuestionApp } from "../../shared/components/base-question-app";
import { IAuthoredState, IInteractiveState } from "./types";
import { Runtime } from "./runtime";
import { IframeAuthoring } from "./iframe-authoring";
import { migrateAuthoredState } from "./state-migrations";

export const baseAuthoringProps = {
  schema: {
    type: "object",
    properties: {
      version: {
        type: "number",
        default: 2
      },
      subinteractives: {
        type: "array",
        title: "Interactive to scale",
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
    subinteractives: {
      items: {
        "ui:field": "iframeAuthoring"
      }    }
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
    migrateAuthoredState={migrateAuthoredState}
  />
);
