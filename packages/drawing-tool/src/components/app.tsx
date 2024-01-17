import React from "react";
import { Runtime } from "./runtime";
import { RJSFSchema } from "@rjsf/utils";
import { BaseQuestionApp } from "@concord-consortium/question-interactives-helpers/src/components/base-question-app";
import { exportToMediaLibraryAuthoringProps } from "@concord-consortium/question-interactives-helpers/src/utilities/media-library";
import { IAuthoredState, IInteractiveState, defaultHideableDrawingTools } from "./types";
import { FormValidation } from "@rjsf/utils";
import { HideDrawingToolsWidget } from "./hide-drawing-tools-widget";

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
        "Objects (predefined)",
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

export const exportToMediaLibrary = exportToMediaLibraryAuthoringProps({
  exportLabel: "Background Image URL",
  type: "image",
  url: "backgroundImageUrl",
  caption: false,
  addAllowUpload: true,
});

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
      hideDrawingTools: {
        type: "array",
        title: "Hide Toolbar Buttons",
        hint: "Check the boxes below to hide draw tool buttons from the toolbar.",
        items: {
          type: "string",
          enum: defaultHideableDrawingTools,
        },
        uniqueItems: true,
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
      },
      ...exportToMediaLibrary.schemaProperties
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
                enum: ["none"],
                enumNames: ["No linked interactives available"]
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
  } as RJSFSchema,

  uiSchema: {
    "ui:order": [
      "prompt", "required", "predictionFeedback", "hint", "backgroundSource", "snapshotTarget", "backgroundImageUrl",
      "imageFit", "imagePosition", "stampCollections", "hideDrawingTools", "version", "questionType", ...exportToMediaLibrary.uiOrder
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
      "ui:help": "Path to hosted image file (jpg, png, gif, etc)",
      "ui:widget": "imageUpload"
    },
    imageFit: {
      "ui:widget": "radio"
    },
    imagePosition: {
      "ui:widget": "radio"
    },
    snapshotTarget: {
      "ui:enumDisabled": []
    },
    hideDrawingTools: {
      "ui:widget": HideDrawingToolsWidget
    },
    ...exportToMediaLibrary.uiSchema
  },
  // Can't get defaults to work with custom stamps, so validating would be ugly and confusing for users until
  // they enter the required properties after they select a custom stamp, so skipping this for now.

  // Omit<IAuthoredState, "questionType"> lets us use this validation function directly in other question types (ImageQuestion).
  validate: (formData: Omit<IAuthoredState, "questionType">, errors: FormValidation) => {
    if (formData.backgroundImageUrl && formData.backgroundSource === "url") {
      try {
        const url = new URL(formData.backgroundImageUrl);
        // concordqa.org should be used by the staging environment. token-service-files.s3.amazonaws.com probably should
        // not be used at all, but Token Service has been misconfigured for a long time and it's used for plenty of
        // authored backgrounds. See: https://www.pivotaltracker.com/story/show/185233166
        if (!url.host.match(/concord\.org/) && !url.host.match(/concordqa\.org/) && !url.host.match(/token-service-files\.s3\.amazonaws\.com/)) {
          errors.backgroundImageUrl?.addError(`Please use only uploaded images or images hosted at *.concord.org.`);
        }
      } catch (e) {
        errors.backgroundImageUrl?.addError(`Invalid background image URL.`);
      }
    }
    return errors;
  }
};

const isAnswered = (interactiveState: IInteractiveState | null) => !!interactiveState?.drawingState || !!interactiveState?.userBackgroundImageUrl;

export const App = () => (
  <BaseQuestionApp<IAuthoredState, IInteractiveState>
    Runtime={Runtime}
    baseAuthoringProps={baseAuthoringProps}
    disableAutoHeight={false}
    isAnswered={isAnswered}
    linkedInteractiveProps={[{ label: "snapshotTarget", supportsSnapshots: true }]}
  />
);

