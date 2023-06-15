import React from "react";
import { BaseApp } from "@concord-consortium/question-interactives-helpers/src/components/base-app";
import { exportToMediaLibraryAuthoringProps } from "@concord-consortium/question-interactives-helpers/src/utilities/media-library";
import { IAuthoredState } from "./types";
import { Runtime } from "./runtime";
import { RJSFSchema } from "@rjsf/utils";

const exportToMediaLibrary = exportToMediaLibraryAuthoringProps({
  exportLabel: "URL",
  type: "image",
  url: "url",
  caption: "caption"
});

const baseAuthoringProps = {
  schema: {
    type: "object",
    properties: {
      version: {
        type: "number",
        default: 1
      },
      url: {
        title: "URL",
        type: "string",
        format: "uri"
      },
      highResUrl: {
        title: "URL (high-resolution image)",
        type: "string",
        format: "uri"
      },
      altText: {
        title: "Alt Text",
        type: "string"
      },
      caption: {
        title: "Caption",
        type: "string"
      },
      credit: {
        title: "Credit",
        type: "string"
      },
      creditLink: {
        title: "Credit Link",
        type: "string"
      },
      creditLinkDisplayText: {
        title: "Credit Link Display Text",
        type: "string"
      },
      scaling: {
        title: "Choose a scaling style for the image",
        type: "string",
        default: "fitWidth",
        oneOf: [
          {
            "type": "string",
            "title": "Fit Width - Image will be scaled to use all available width",
            "enum": [
              "fitWidth"
            ]
          },
          {
            "type": "string",
            "title": "Original Dimensions - Very small images will not be enlarged",
            "enum": [
              "originalDimensions"
            ]
          },
        ]
      },
      ...exportToMediaLibrary.schemaProperties
    }
  } as RJSFSchema,

  uiSchema: {
    version: {
      "ui:widget": "hidden"
    },
    url: {
      "ui:widget": "imageUpload",
      "ui:help": "Path to hosted image file (jpg, png, gif, etc)"
    },
    highResUrl: {
      "ui:widget": "imageUpload",
      "ui:help": "Path to high-resolution hosted image file (jpg, png, gif, etc) for zoomed-in view (optional)"
    },
    altText: {
      "ui:widget": "textarea",
      "ui:help": "Alt text is the written copy that appears in place of an image on a webpage if the image fails to load on a user's screen. This text enables screen-reading tools to describe images to visually impaired readers, so it is recommended that descriptive text is included for all images."
    },
    caption: {
      "ui:widget": "textarea"
    },
    credit: {
      "ui:widget": "textarea"
    },
    creditLink: {
      "ui:widget": "textarea",
      "ui:help": "Link to attribution"
    },
    creditLinkDisplayText: {
      "ui:help": "Text to display for the link to attribution (leave blank to display the url)"
    },
    scaling: {
      "ui:widget": "radio"
    },
    ...exportToMediaLibrary.uiSchema
  }
};

export const App = () => (
  <BaseApp<IAuthoredState>
    Runtime={Runtime}
    baseAuthoringProps={baseAuthoringProps}
    disableAutoHeight={false}
  />
);
