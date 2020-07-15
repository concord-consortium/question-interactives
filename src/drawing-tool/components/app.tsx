import React from "react";
import { Runtime } from "./runtime";
import { JSONSchema6 } from "json-schema";
import { IRuntimeInteractiveMetadata, IAuthoringInteractiveMetadata } from "@concord-consortium/lara-interactive-api";
import { BaseQuestionApp } from "../../shared/components/base-question-app";

// Note that TS interfaces should match JSON schema. Currently there's no way to generate one from the other.
// TS interfaces are not available in runtime in contrast to JSON schema.

interface StampCollection {
  collection: "molecules" | "ngsaObjects" | "custom";
  name?: string;
  stamps?: string[];
}

export interface IAuthoredState extends IAuthoringInteractiveMetadata {
  version: number;
  hint?: string;
  backgroundImageUrl?: string;
  imageFit: string;
  imagePosition: string;
  stampCollections: StampCollection[];
}

export interface IInteractiveState extends IRuntimeInteractiveMetadata {
  drawingState: string;
}

const baseAuthoringProps = {
  schema: {
    type: "object",
    definitions: {
      stampCollection: {
        title: "Stamp collection",
        type: "object",
        properties: {
          collection: {
            type: "string",
            enum: [
              "molecules",
              "ngsaObjects",
              "custom"
            ],
            enumNames: [
              "Molecules (predefined)",
              "NGSA Objects (predefined)",
              "Custom"
            ],
            default: "molecules"
          }
        },
        required: [
          "collection"
        ],
        dependencies: {
          collection: {
            oneOf: [
              {
                properties: {
                  collection: {
                    enum: [
                      "molecules"
                    ]
                  },
                  name: {
                    title: "Collection title",
                    type: "string",
                    default: "Molecules"
                  }
                }
              },
              {
                properties: {
                  collection: {
                    enum: [
                      "ngsaObjects"
                    ]
                  },
                  name: {
                    title: "Collection title",
                    type: "string",
                    default: "Objects"
                  }
                }
              },
              {
                properties: {
                  collection: {
                    enum: [
                      "custom"
                    ]
                  },
                  name: {
                    title: "Collection title",
                    type: "string",
                    default: "My Stamps"
                  },
                  stamps: {
                    title: "Stamps",
                    type: "array",
                    items: {
                      type: "string",
                      default: "https://"
                    },
                    default: ["https://"]
                  }
                },
                required: [
                  "name"
                ]
              }
            ]
          }
        }
      },
    },
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
        type: "boolean"
      },
      hint: {
        title: "Hint",
        type: "string"
      },
      backgroundImageUrl: {
        title: "Background Image URL",
        type: "string",
        format: "uri"
      },
      imageFit: {
        title: "Background image fit",
        type: "string",
        default: "shrinkBackgroundToCanvas",
        enum: [
          "shrinkBackgroundToCanvas",
          "resizeBackgroundToCanvas",
          "resizeCanvasToBackground"
        ],
        enumNames: [
          "Shrink image if needed (do not grow)",
          "Set image to canvas size",
          "Set canvas to image size"
        ]
      },
      imagePosition: {
        title: "Background image position (for smaller images)",
        type: "string",
        default: "center",
        enum: [
          "center",
          "top-left"
        ],
        enumNames: [
          "Center",
          "Top-left"
        ]
      },
      stampCollections: {
        type: "array",
        title: "Stamp collections",
        items: {
          "$ref": "#/definitions/stampCollection"
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
    backgroundImageUrl: {
      "ui:help": "Path to hosted image file (jpg, png, gif, etc)"
    },
    imageFit: {
      "ui:widget": "radio"
    },
    imagePosition: {
      "ui:widget": "radio"
    }
  },

  // Can't get defaults to work with custom stamps, so validating would be ugly and confusing for users until
  // they enter the required properties after they select a custom stamp, so skipping this for now.
  // validate: (formData: IAuthoredState, errors: FormValidation) => {
  //   return errors;
  // }
};

const isAnswered = (interactiveState: IInteractiveState | null) => !!interactiveState?.answerText;

export const App = () => (
  <BaseQuestionApp<IAuthoredState, IInteractiveState>
    Runtime={Runtime}
    baseAuthoringProps={baseAuthoringProps}
    disableAutoHeight={false}
    isAnswered={isAnswered}
  />
);
