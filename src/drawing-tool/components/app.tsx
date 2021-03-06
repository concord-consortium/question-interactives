import React from "react";
import { Runtime } from "./runtime";
import { JSONSchema6 } from "json-schema";
import { BaseQuestionApp } from "../../shared/components/base-question-app";
import { IAuthoredState, IInteractiveState } from "./types";
import { FormValidation } from "react-jsonschema-form";

// Note that TS interfaces should match JSON schema. Currently there"s no way to generate one from the other.
// TS interfaces are not available in runtime in contrast to JSON schema.
export const stampCollectionDefinition = {
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
};

const backgroundProps = {
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
  }
};

export const baseAuthoringProps = {
  schema: {
    type: "object",
    definitions: {
      stampCollection: stampCollectionDefinition,
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
      stampCollections: {
        type: "array",
        title: "Stamp collections",
        items: {
          "$ref": "#/definitions/stampCollection"
        }
      },
      backgroundSource: {
        title: "Background source",
        type: "string",
        enum: [
          "url",
          "upload",
          "snapshot"
        ],
        enumNames: [
          "URL",
          "Upload",
          "Snapshot"
        ]
      }
    },
    dependencies: {
      backgroundSource: {
        oneOf: [
          {
            properties: {
              backgroundSource: {
                enum: [ "url" ]
              },
              backgroundImageUrl: {
                title: "Background Image URL",
                type: "string",
                format: "uri"
              },
              ...backgroundProps
            }
          },
          {
            properties: {
              backgroundSource: {
                enum: [ "upload" ]
              },
              ...backgroundProps
            }
          },
          {
            properties: {
              backgroundSource: {
                enum: [ "snapshot" ]
              },
              snapshotTarget: {
                title: "Snapshot target",
                type: "string",
                enum: [],
                enumNames: []
              },
              ...backgroundProps
            }
          }
        ]
      },
      required: {
        oneOf: [
          {
            properties: {
              required: {
                enum: [ false ]
              }
            }
          },
          {
            properties: {
              required: {
                enum: [ true ]
              },
              predictionFeedback: {
                title: "Post-submission feedback (optional)",
                type: "string"
              }
            }
          }
        ]
      },
    }
  } as JSONSchema6,

  uiSchema: {
    "ui:order": [
      "prompt", "required", "predictionFeedback", "hint", "backgroundSource", "snapshotTarget", "backgroundImageUrl",
      "imageFit", "imagePosition",  "stampCollections", "version", "questionType"
    ],
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

  // Omit<IAuthoredState, "questionType"> lets us use this validation function directly in other question types (ImageQuestion).
  validate: (formData: Omit<IAuthoredState, "questionType">, errors: FormValidation) => {
    if (formData.backgroundImageUrl && formData.backgroundSource === "url") {
      try {
        const url = new URL(formData.backgroundImageUrl);
        if (!url.host.match(/concord\.org/)) {
          errors.backgroundImageUrl.addError(`Please use only images hosted at *.concord.org.`);
        }
      } catch (e) {
        errors.backgroundImageUrl.addError(`Invalid background image URL.`);
      }
    }
    return errors;
  }
};

const isAnswered = (interactiveState: IInteractiveState | null) => !!interactiveState?.drawingState;

export const App = () => (
  <BaseQuestionApp<IAuthoredState, IInteractiveState>
    Runtime={Runtime}
    baseAuthoringProps={baseAuthoringProps}
    disableAutoHeight={false}
    isAnswered={isAnswered}
    linkedInteractiveProps={[{ label: "snapshotTarget", supportsSnapshots: true }]}
  />
);
