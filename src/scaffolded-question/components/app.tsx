import React from "react";
import { JSONSchema6 } from "json-schema";
import { BaseQuestionApp } from "../../shared/components/base-question-app";
import { Runtime } from "./runtime";
import { IframeAuthoring } from "./iframe-authoring";
import {
  IAuthoringInteractiveMetadata, IRuntimeInteractiveMetadata
} from "@concord-consortium/lara-interactive-api";

// Note that TS interfaces should match JSON schema. Currently there's no way to generate one from the other.
// TS interfaces are not available in runtime in contrast to JSON schema.

export interface IAuthoredState extends IAuthoringInteractiveMetadata {
  version: number;
  hint?: string;
  subinteractives?: {
    id: string;
    url: string;
    authoredState: any;
  }[]
}

export interface IInteractiveState extends IRuntimeInteractiveMetadata {
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
    // Disable default focus in, focus out and answer saved events logging. Scaffolded Question Runtime
    // listens to subquestion logs and passes them to LARA (adding some context info). Logging answer text second time
    // from the parent question creates more confusing event stream. Also, focus in and out events don't work too
    // well, as iframe is not treated as input. So default focus in and out would be only triggered if user used
    // hint or submit buttons. But these events also make event stream more confusing.
    disableBasicLogging={true}
  />
);
