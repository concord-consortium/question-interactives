import { RJSFSchema } from "@rjsf/utils";
import { IAuthoringConfig, IGenericAuthoringData } from "../components/types";

// Generic/fallback configuration for non-CODAP URLs
// Provides simple text input for editing the wrapped interactive URL
export const genericAuthoringConfig: IAuthoringConfig<IGenericAuthoringData> = {
  type: 'generic',
  dataVersion: 1,  // Increment when IGenericAuthoringData shape changes

  schema: {
    type: "object",
    properties: {
      sourceUrl: {
        title: "Wrapped Interactive URL",
        type: "string",
        description: "Full URL of the interactive to wrap (including any query parameters)"
      },
      enableFullscreen: {
        title: "Enable Fullscreen Mode",
        type: "boolean",
        default: true
      }
    },
    required: ["sourceUrl"]
  } as RJSFSchema,

  uiSchema: {
    sourceUrl: {
      "ui:widget": "textarea",
      "ui:options": {
        rows: 5
      }
    },
    enableFullscreen: {
      "ui:widget": "checkbox",
      "ui:help": "Enable fullscreen scaling and fullscreen button (uncheck to disable)"
    }
  },

  initialData: {
    sourceUrl: "",
    enableFullscreen: true
  },

  // For generic config, the source URL is used directly as the wrapped URL
  // (no transformation needed, unlike CODAP which builds a complex URL)
  buildUrl: (formData) => formData.sourceUrl || null,

  // Extract disableFullscreen from form data (negated checkbox value)
  getDisableFullscreen: (formData) => !formData.enableFullscreen
};
