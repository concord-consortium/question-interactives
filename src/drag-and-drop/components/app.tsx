import React from "react";
import { JSONSchema6 } from "json-schema";
import { BaseQuestionApp } from "../../shared/components/base-question-app";
import { Runtime } from "./runtime";
import { IAuthoredState, IInteractiveState } from "./types";
import { v4 as uuidv4 } from "uuid";
import { InitialStateField } from "./initial-state-field";

// Note that TS interfaces should match JSON schema. Currently there's no way to generate one from the other.
// TS interfaces are not available in runtime in contrast to JSON schema.

export const baseAuthoringProps = {
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
        type: "string",
      },
      draggingAreaPrompt: {
        title: "Prompt inside dragging area",
        type: "string",
        default: "Drag following items:"
      },
      required: {
        title: "Required",
        type: "boolean"
      },
      hint: {
        title: "Hint",
        type: "string"
      },
      canvasWidth: {
        title: "Canvas width (px)",
        type: "number",
        default: 330
      },
      canvasHeight: {
        title: "Canvas height (px)",
        type: "number",
        default: 300
      },
      backgroundImageUrl: {
        title: "Background image URL",
        type: "string",
        format: "uri"
      },
      draggableItems: {
        type: "array",
        title: "Draggable items",
        items: {
          type: "object",
          properties: {
            id: {
              type: "string"
            },
            label: {
              title: "Label",
              type: "string"
            },
            value: {
              title: "Value",
              type: "number"
            },
            targetMatch: {
              title: "Target to match",
              type: "number"
            },
            imageUrl: {
              title: "Image URL",
              type: "string",
              format: "uri"
            },
          }
        }
      },
      enableCheckAnswer: {
        title: "Allow users to check answers",
        type: "boolean",
      },
      dropZones: {
        type: "array",
        title: "Targets",
        items: {
          type: "object",
          properties: {
            id: {
              type: "string"
            },
            targetLabel: {
              title: "Target label",
              type: "string"
            },
            targetWidth: {
              title: "Target width",
              type: "number",
              default: 100
            },
            targetHeight: {
              title: "Target height",
              type: "number",
              default: 100
            },
          }
        }
      },
      initialState: {
        type: "object",
        properties: {
          itemPositions: {
            type: "object"
          },
          targetPositions: {
            type: "object"
          },
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
      "ui:widget": "richtext"
    },
    draggingAreaPrompt: {
      "ui:widget": "richtext"
    },
    hint: {
      "ui:widget": "richtext"
    },
    backgroundImageUrl: {
      "ui:widget": "imageUpload"
    },
    draggableItems: {
      items: {
        id: {
          "ui:widget": "hidden"
        },
        imageUrl: {
          "ui:widget": "imageUpload"
        }
      }
    },
    dropZones: {
      items: {
        id: {
          "ui:widget": "hidden"
        }
      }
    },
    initialState: {
      "ui:field": "initialState"
    }
  },

  fields: {
    initialState: InitialStateField
  },

  preprocessFormData: (authoredState: IAuthoredState) => {
    // Generate choice ID if necessary.
    authoredState.draggableItems?.forEach(item => {
      if (item.id === undefined) {
        item.id = uuidv4();
      }
    });
    authoredState.dropZones?.forEach(target => {
      if (target.id === undefined) {
        target.id = uuidv4();
      }
    });
    return authoredState;
  }
};

const isAnswered = (interactiveState: IInteractiveState) => !!interactiveState?.itemPositions;

export const App = () => (
  <BaseQuestionApp<IAuthoredState, IInteractiveState>
    Runtime={Runtime}
    baseAuthoringProps={baseAuthoringProps}
    isAnswered={isAnswered}
  />
);

