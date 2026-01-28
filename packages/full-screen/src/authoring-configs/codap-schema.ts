import { RJSFSchema, UiSchema } from "@rjsf/utils";
import { ICodapAuthoringData } from "../components/types";

/**
 * Initial/default data for CODAP authoring form.
 * Defined first so schema can reference these values (DRY - single source of truth).
 */
export const codapInitialData: ICodapAuthoringData = {
  codapSourceDocumentUrl: "",
  displayFullscreenButton: true,  // Only this defaults to true
  displayDataVisibilityToggles: false,
  displayAllComponentsAlways: false,
  removeToolbarsAndGrid: false,
  lockComponents: false,
  advancedOptions: {
    enableDi: false,
    diPluginUrl: "",
    enableDiOverride: false,
    diOverrideValue: "",
    enableGuideIndex: false,
    guideIndexValue: 0,
    enableCustomParams: false,
    customParamsValue: "",
    // Read-only, calculated field showing the final URL.
    // Uses empty string (not undefined) for RJSF compatibility.
    generatedUrl: ""
  }
};

/**
 * JSON Schema for CODAP authoring form.
 * Default values reference codapInitialData to ensure consistency (DRY).
 */
export const codapSchema: RJSFSchema = {
  type: "object",
  properties: {
    // Source URL input - accepts various CODAP URL formats
    codapSourceDocumentUrl: {
      title: "CODAP Source Document URL",
      type: "string",
      description: "Paste a share link displayed in the CODAP Share dialog"
    },

    // CODAP Options section
    // Note: Descriptions for checkboxes use ui:help in uiSchema to avoid RJSF v5 duplication
    displayFullscreenButton: {
      title: "Display fullscreen button",
      type: "boolean",
      default: codapInitialData.displayFullscreenButton
    },
    displayDataVisibilityToggles: {
      title: "Display data visibility toggles on graphs (app=is)",
      type: "boolean",
      default: codapInitialData.displayDataVisibilityToggles
    },
    displayAllComponentsAlways: {
      title: "Display all visible components within the bounds of the visible CODAP canvas (no scrollbars) (inbounds=true)",
      type: "boolean",
      default: codapInitialData.displayAllComponentsAlways
    },
    removeToolbarsAndGrid: {
      title: "Remove toolbars & background grid (embeddedMode=yes)",
      type: "boolean",
      default: codapInitialData.removeToolbarsAndGrid
    },
    lockComponents: {
      title: "Lock components (componentMode=yes)",
      type: "boolean",
      default: codapInitialData.lockComponents
    },

    // Advanced CODAP Options (collapsible)
    // Note: Descriptions for checkboxes use ui:help in uiSchema to avoid RJSF v5 duplication
    advancedOptions: {
      title: "Advanced CODAP Options",
      type: "object",
      properties: {
        enableDi: {
          title: "Load a plugin from a url (di=url)",
          type: "boolean",
          default: codapInitialData.advancedOptions.enableDi
        },
        diPluginUrl: {
          title: "Plugin URL",
          type: "string"
        },
        enableDiOverride: {
          title: "Replace the contents of an existing plugin or webview (di-override=string)",
          type: "boolean",
          default: codapInitialData.advancedOptions.enableDiOverride
        },
        diOverrideValue: {
          title: "value",
          type: "string"
        },
        enableGuideIndex: {
          title: "Display a specific guide page (guideIndex=int)",
          type: "boolean",
          default: codapInitialData.advancedOptions.enableGuideIndex
        },
        guideIndexValue: {
          title: "value",
          type: "integer",
          minimum: 0,
          default: codapInitialData.advancedOptions.guideIndexValue
        },
        enableCustomParams: {
          title: "Custom URL parameters",
          type: "boolean",
          default: codapInitialData.advancedOptions.enableCustomParams
        },
        customParamsValue: {
          title: "",
          type: "string"
        },
        // Passthrough params display (read-only, computed from source URL)
        // Only displayed when there are passthrough params
        passthroughParamsDisplay: {
          title: "Passthrough Parameters",
          type: "string",
          readOnly: true,
          description: "These parameters from the source URL will be included in the generated URL (not controlled by form options above)"
        },
        // Generated URL (read-only, calculated)
        generatedUrl: {
          title: "Generated URL",
          type: "string",
          readOnly: true,
          description: "The final URL that will be used for this CODAP interactive (read-only)"
        }
      }
    }
  }
};

/**
 * UI Schema for CODAP authoring form
 * NOTE: RJSF does not natively support template expressions like "{{!formData.x}}".
 * The disabled states and conditional visibility are computed dynamically via
 * the computeUiSchema function in codap-config.ts. The values here are defaults
 * that get overridden at runtime based on formData.
 */
export const codapUiSchema: UiSchema = {
  codapSourceDocumentUrl: {
    "ui:widget": "textarea",
    "ui:options": {
      rows: 7
    },
    "ui:placeholder": "Paste CODAP shared link or document URL here..."
  },
  displayFullscreenButton: {
    "ui:widget": "checkbox",
    "ui:help": "Allows users to open CODAP in fullscreen by clicking fullscreen button"
  },
  displayDataVisibilityToggles: {
    "ui:widget": "checkbox",
    "ui:help": "Adds to graphs an option to toggle the visibility of cases based on the leftmost attribute in the dataset being graphed"
  },
  displayAllComponentsAlways: {
    "ui:widget": "checkbox",
    "ui:help": "Keeps components displayed inside the browser window. If the window/browser is resized components will move to stay within bounds of the CODAP canvas. Users will not be able to place any components so that they would extend beyond the boundaries of the currently visible canvas. (Note, can result in components overlapping or being moved from the original layout if the document is opened on a smaller screen than which it was authored.)"
  },
  removeToolbarsAndGrid: {
    "ui:widget": "checkbox",
    "ui:help": "Removes toolbars and background grid; all components remain moveable"
  },
  lockComponents: {
    "ui:widget": "checkbox",
    "ui:disabled": true,  // Default; overridden by computeUiSchema when removeToolbarsAndGrid is checked
    "ui:help": "Locks position of components and prevents the user from moving them around the canvas. Only active when 'Remove toolbars & background grid' is checked.",
    "ui:classNames": "indented-field"
  },
  advancedOptions: {
    "ui:options": {
      collapsible: true,
      collapsed: true
    },
    enableDi: {
      "ui:help": "Requires a string specifying the URL of a plugin to load"
    },
    enableDiOverride: {
      "ui:disabled": true,  // Default; overridden by computeUiSchema when enableDi is checked
      "ui:help": "Requires a string value that is a substring of the existing plugin URL to be replaced. Only active when 'di' is checked.",
      "ui:classNames": "indented-field"
    },
    diPluginUrl: {
      "ui:label": false,
      "ui:disabled": true,  // Default; overridden by computeUiSchema
      "ui:classNames": "indented-field"
    },
    diOverrideValue: {
      "ui:label": false,
      "ui:disabled": true,  // Default; overridden by computeUiSchema
      "ui:classNames": "indented-field"
    },
    enableGuideIndex: {
      "ui:help": "Requires an integer which specifies which guide page to be displayed upon load; default is 0 (first page)"
    },
    guideIndexValue: {
      "ui:label": false,
      "ui:disabled": true  // Default; overridden by computeUiSchema
    },
    enableCustomParams: {
      "ui:help": "Enter additional CODAP URL parameters. Supports query string format (key1=value1&key2=value2) or one key=value pair per line."
    },
    customParamsValue: {
      "ui:widget": "textarea",
      "ui:label": false,
      "ui:options": {
        rows: 3
      },
      "ui:placeholder": "key1=value1&key2=value2\nor one per line:\nfoo=bar",
      "ui:disabled": true  // Default; overridden by computeUiSchema
    },
    passthroughParamsDisplay: {
      "ui:widget": "textarea",
      "ui:readonly": true,
      "ui:options": {
        rows: 2
      }
      // Hidden when empty via computeUiSchema setting ui:widget to "hidden"
    },
    generatedUrl: {
      "ui:widget": "textarea",
      "ui:readonly": true,
      "ui:options": {
        rows: 7
      }
    },
    "ui:order": [
      "enableDi",
      "diPluginUrl",
      "enableDiOverride",
      "diOverrideValue",
      "enableGuideIndex",
      "guideIndexValue",
      "enableCustomParams",
      "customParamsValue",
      "passthroughParamsDisplay",
      "generatedUrl"
    ]
  },
  "ui:order": [
    "codapSourceDocumentUrl",
    "displayFullscreenButton",
    "displayDataVisibilityToggles",
    "displayAllComponentsAlways",
    "removeToolbarsAndGrid",
    "lockComponents",
    "advancedOptions"
  ]
};
