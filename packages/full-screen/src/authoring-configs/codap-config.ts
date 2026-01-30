import { UiSchema } from "@rjsf/utils";
import { IAuthoringConfig, IAuthoredState, IValidationResult, ICodapAuthoringData } from "../components/types";
import { detectInteractiveType } from "../utils/detect-interactive-type";
import {
  parseCodapUrlToFormData,
  buildCodapUrl,
  getFilteredPassthroughParams,
  formatPassthroughParamsDisplay
} from "./codap-url-utils";
import { codapSchema, codapUiSchema, codapInitialData } from "./codap-schema";

// ============================================================================
// Validation Helpers
// ============================================================================

// Validation helper: check if string is a valid URL
const isValidUrl = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

// Validation helper: check if URL looks like a CODAP URL
const isCodapUrl = (url: string): boolean => {
  return detectInteractiveType(url) === 'codap';
};

// Validation helper: check custom params format
const validateCustomParams = (params: string): string | null => {
  if (!params.trim()) return null;

  // Split by & or newlines
  const pairs = params.split(/[&\n]/).filter(p => p.trim());

  for (const pair of pairs) {
    const trimmed = pair.trim();
    if (!trimmed) continue;

    // Check for = sign
    if (!trimmed.includes('=')) {
      return `Invalid format: "${trimmed}" is missing "=" sign. Use key=value format.`;
    }

    // Check for empty key
    const [key] = trimmed.split('=');
    if (!key.trim()) {
      return `Invalid format: empty key in "${trimmed}". Use key=value format.`;
    }
  }

  return null;
};

// ============================================================================
// CODAP Authoring Configuration
// ============================================================================

export const codapAuthoringConfig: IAuthoringConfig<ICodapAuthoringData> = {
  type: 'codap',
  dataVersion: 1,  // Increment when ICodapAuthoringData shape changes

  // Import schema, uiSchema, and initialData from codap-schema.ts
  schema: codapSchema,
  uiSchema: codapUiSchema,
  initialData: codapInitialData,

  // Compute dynamic uiSchema based on current form data
  // Handles disabled states for conditional fields and visibility of passthrough params
  computeUiSchema: (formData: ICodapAuthoringData, baseUiSchema: UiSchema): UiSchema => {
    const advanced = formData.advancedOptions || {};

    // Check if there are passthrough params to display (before filtering)
    const unfilteredPassthrough = getFilteredPassthroughParams(
      formData.codapSourceDocumentUrl,
      undefined,
      false
    );
    const hasAnyPassthroughParams = Object.keys(unfilteredPassthrough).length > 0;

    // Show the field if there are any passthrough params (even if overridden)
    // The actual display content (params or override message) is set in computeFormData
    const showPassthroughField = hasAnyPassthroughParams;

    return {
      ...baseUiSchema,
      // lockComponents is only enabled when removeToolbarsAndGrid is checked
      lockComponents: {
        ...(baseUiSchema.lockComponents as object),
        "ui:disabled": !formData.removeToolbarsAndGrid
      },
      advancedOptions: {
        ...(baseUiSchema.advancedOptions as object),
        // enableDiOverride checkbox is only enabled when enableDi is checked
        enableDiOverride: {
          ...((baseUiSchema.advancedOptions as any)?.enableDiOverride),
          "ui:disabled": !advanced.enableDi
        },
        diPluginUrl: {
          ...((baseUiSchema.advancedOptions as any)?.diPluginUrl),
          "ui:disabled": !advanced.enableDi
        },
        diOverrideValue: {
          ...((baseUiSchema.advancedOptions as any)?.diOverrideValue),
          "ui:disabled": !advanced.enableDiOverride
        },
        guideIndexValue: {
          ...((baseUiSchema.advancedOptions as any)?.guideIndexValue),
          "ui:disabled": !advanced.enableGuideIndex
        },
        customParamsValue: {
          ...((baseUiSchema.advancedOptions as any)?.customParamsValue),
          "ui:disabled": !advanced.enableCustomParams
        },
        passthroughParamsDisplay: {
          ...((baseUiSchema.advancedOptions as any)?.passthroughParamsDisplay),
          // Show field if URL has any passthrough params (displays either params or override message)
          "ui:widget": showPassthroughField ? "textarea" : "hidden"
        }
      }
    };
  },

  // Parse an existing CODAP URL into form data (for editing interactives without authoringConfig)
  parseUrlToFormData: parseCodapUrlToFormData,

  // Build the final CODAP URL from form data
  buildUrl: buildCodapUrl,

  // Field name containing the source URL (for re-parse detection when URL changes)
  sourceUrlField: 'codapSourceDocumentUrl',

  // Extract disableFullscreen from form data (negated checkbox value)
  getDisableFullscreen: (formData: ICodapAuthoringData) => !formData.displayFullscreenButton,

  // Validate form data and return warnings/errors for display
  // Uses RJSF v5 extraErrors format: { fieldName: { __errors: ['message'] } }
  validateFormData: (formData: ICodapAuthoringData): IValidationResult => {
    const result: IValidationResult = {};
    const url = formData.codapSourceDocumentUrl || '';

    // Warn if URL doesn't look like a CODAP URL
    // Skip URL validation for iframe embeds - they're not URLs but are fully supported
    const isIframeEmbed = url.trim().startsWith('<iframe');
    if (url && !isIframeEmbed && !isValidUrl(url)) {
      result.codapSourceDocumentUrl = {
        message: 'This does not appear to be a valid URL',
        severity: 'error'
      };
    } else if (url && !isCodapUrl(url)) {
      result.codapSourceDocumentUrl = {
        message: 'This URL does not appear to be a CODAP link. It will still work, but CODAP-specific options may not apply.',
        severity: 'warning'
      };
    }

    // Validate custom params format if enabled
    const advanced = formData.advancedOptions || {};
    if (advanced.enableCustomParams && advanced.customParamsValue) {
      const paramsError = validateCustomParams(advanced.customParamsValue);
      if (paramsError) {
        result['advancedOptions.customParamsValue'] = {
          message: paramsError,
          severity: 'warning'
        };
      }
    }

    return result;
  },

  // Merge parsed URL data with current form data when the source URL changes.
  // Preserves independent authoring choices that can't be determined from the URL.
  mergeWithParsedUrl: (currentData: ICodapAuthoringData, parsedData: ICodapAuthoringData): ICodapAuthoringData => {
    const currentAdvanced = currentData.advancedOptions || {};
    const parsedAdvanced = parsedData.advancedOptions || {};

    return {
      ...parsedData,
      // Always preserve: never derivable from source URL
      displayFullscreenButton: currentData.displayFullscreenButton,
      advancedOptions: {
        ...parsedAdvanced,
        // Always preserve: custom params are never in the source URL
        enableCustomParams: currentAdvanced.enableCustomParams ?? false,
        customParamsValue: currentAdvanced.customParamsValue ?? '',
        // Conditionally preserve: use parsed value when URL had the param,
        // otherwise keep current. parseCodapUrlToFormData sets enable* to true
        // only when the param exists, so false means "absent from URL".
        ...(parsedAdvanced.enableDi ? {} : {
          enableDi: currentAdvanced.enableDi ?? false,
          diPluginUrl: currentAdvanced.diPluginUrl ?? '',
        }),
        ...(parsedAdvanced.enableDiOverride ? {} : {
          enableDiOverride: currentAdvanced.enableDiOverride ?? false,
          diOverrideValue: currentAdvanced.diOverrideValue ?? '',
        }),
        ...(parsedAdvanced.enableGuideIndex ? {} : {
          enableGuideIndex: currentAdvanced.enableGuideIndex ?? false,
          guideIndexValue: currentAdvanced.guideIndexValue ?? 0,
        }),
      }
    };
  },

  // Compute derived display values for form data (generatedUrl, passthroughParamsDisplay)
  computeFormData: (formData: ICodapAuthoringData, authoredState: IAuthoredState): ICodapAuthoringData => {
    const advanced = formData.advancedOptions || {};

    // Get unfiltered passthrough params (before custom params override)
    const unfilteredPassthrough = getFilteredPassthroughParams(
      formData.codapSourceDocumentUrl,
      undefined,  // No custom params = unfiltered
      false
    );

    // Get filtered passthrough params (after custom params override)
    const filteredPassthrough = getFilteredPassthroughParams(
      formData.codapSourceDocumentUrl,
      advanced.customParamsValue,
      advanced.enableCustomParams
    );

    // Determine what to display:
    // - If filtered has params, show them
    // - If unfiltered has params but filtered is empty, show override explanation
    // - Otherwise show nothing (empty string hides the field via computeUiSchema)
    let passthroughParamsDisplay: string;
    const hasUnfiltered = Object.keys(unfilteredPassthrough).length > 0;
    const hasFiltered = Object.keys(filteredPassthrough).length > 0;

    if (hasFiltered) {
      passthroughParamsDisplay = formatPassthroughParamsDisplay(filteredPassthrough);
    } else if (hasUnfiltered && advanced.enableCustomParams) {
      // Passthrough params exist but are all overridden by custom params
      passthroughParamsDisplay = '(All passthrough parameters are overridden by custom parameters above)';
    } else {
      passthroughParamsDisplay = '';
    }

    return {
      ...formData,
      advancedOptions: {
        ...formData.advancedOptions,
        passthroughParamsDisplay,
        // Compute from current formData so the display is always up-to-date.
        // (authoredState.wrappedInteractiveUrl can lag behind by a render)
        generatedUrl: buildCodapUrl(formData) || ''
      }
    } as ICodapAuthoringData;
  }
};
