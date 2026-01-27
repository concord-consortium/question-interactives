import React, { useMemo, useState, useCallback, useEffect } from "react";
import Form from "@rjsf/core";
import { ErrorSchema, FieldErrorProps, ObjectFieldTemplateProps } from "@rjsf/utils";
import validator from "@rjsf/validator-ajv8";
import { IAuthoredState, IValidationResult } from "./types";
import { getAuthoringConfig } from "../authoring-configs";

import css from "./authoring.scss";

// NOTE: No CODAP-specific imports here. All type-specific logic is in the config files.
// This keeps authoring.tsx generic and reusable for any interactive type.

/**
 * Convert our IValidationResult to RJSF's extraErrors format.
 * RJSF extraErrors uses nested objects with __errors arrays.
 * We add a custom __severity field to distinguish warnings from errors.
 */
const convertToExtraErrors = (validation: IValidationResult): ErrorSchema => {
  const extraErrors: any = {};

  Object.entries(validation).forEach(([fieldPath, { message, severity }]) => {
    // Handle nested paths like 'advancedOptions.customParamsValue'
    const parts = fieldPath.split('.');
    let current = extraErrors;

    for (let i = 0; i < parts.length - 1; i++) {
      if (!current[parts[i]]) {
        current[parts[i]] = {};
      }
      current = current[parts[i]];
    }

    const lastPart = parts[parts.length - 1];
    current[lastPart] = {
      __errors: [message],
      __severity: severity  // Custom field for styling
    };
  });

  return extraErrors as ErrorSchema;
};

/**
 * Custom FieldErrorTemplate that reads our __severity metadata to apply
 * appropriate styling for warnings vs errors.
 *
 * RJSF doesn't natively support warning severity, so we inject a custom
 * __severity field in extraErrors and read it here to apply CSS classes.
 *
 * IMPORTANT: RJSF INTERNALS DEPENDENCY
 * This implementation relies on RJSF v5 passing through unknown fields
 * (like __severity) in the extraErrors schema to the FieldErrorTemplate.
 * This behavior is not part of RJSF's public API and could change in
 * future versions. If upgrading RJSF, verify that:
 * 1. Custom fields in extraErrors are still accessible via FieldErrorProps.errorSchema
 * 2. The FieldErrorTemplate still receives the full error schema
 * If this breaks, alternatives include:
 * - Using React Context to pass severity info separately
 * - Storing severity in a separate state map keyed by field path
 * - Encoding severity in the error message itself (e.g., "[WARNING] message")
 *
 * Tested with: @rjsf/core ^5.9.0
 */
const FieldErrorTemplate: React.FC<FieldErrorProps> = ({ errors, errorSchema }) => {
  if (!errors || errors.length === 0) {
    return null;
  }

  // Access the raw error schema to get our custom __severity field
  // WARNING: This relies on RJSF passing through custom fields in extraErrors.
  const severity = (errorSchema as any)?.__severity || 'error';

  return (
    <ul className={css.fieldErrors}>
      {errors.map((error, index) => (
        <li
          key={index}
          className={severity === 'warning' ? css.warningMessage : css.errorMessage}
          role={severity === 'error' ? 'alert' : undefined}
        >
          {error}
        </li>
      ))}
    </ul>
  );
};

// Helper to extract error message from unknown error type
const getErrorMessage = (e: unknown, fallback: string): string =>
  e instanceof Error ? e.message : fallback;

/**
 * Custom ObjectFieldTemplate that supports collapsible sections.
 *
 * RJSF's @rjsf/core package doesn't natively support collapsible object fields -
 * that's typically a feature of theme-specific packages like @rjsf/bootstrap-4.
 * This template adds collapsible support by checking for ui:options.collapsible
 * and rendering a native HTML <details>/<summary> element when enabled.
 *
 * Usage in uiSchema:
 *   fieldName: {
 *     "ui:options": {
 *       collapsible: true,   // Enable collapsible behavior
 *       collapsed: true      // Start collapsed (optional, default: false)
 *     }
 *   }
 *
 * Benefits of using <details>/<summary>:
 * - Native browser support, no JavaScript required for toggle
 * - Built-in accessibility (keyboard navigation, screen reader support)
 * - Maintains open/closed state without React state management
 */
const ObjectFieldTemplate: React.FC<ObjectFieldTemplateProps> = (props) => {
  const { title, description, properties, uiSchema } = props;

  // Check if this object should be collapsible
  const uiOptions = uiSchema?.["ui:options"] as { collapsible?: boolean; collapsed?: boolean } | undefined;
  const isCollapsible = uiOptions?.collapsible === true;
  const startCollapsed = uiOptions?.collapsed === true;

  // Render child properties
  const content = (
    <>
      {description && <p className="field-description">{description}</p>}
      {properties.map((prop) => prop.content)}
    </>
  );

  // If collapsible, wrap in <details>/<summary>
  if (isCollapsible) {
    return (
      <details className={css.collapsibleSection} open={!startCollapsed}>
        <summary className={css.collapsibleHeader}>
          {title || "Options"}
        </summary>
        <div className={css.collapsibleContent}>
          {content}
        </div>
      </details>
    );
  }

  // Default rendering for non-collapsible objects
  return (
    <fieldset>
      {title && <legend>{title}</legend>}
      {content}
    </fieldset>
  );
};

interface IProps {
  authoredState: IAuthoredState;
  onAuthoredStateChange: (state: IAuthoredState) => void;
  authoringType: string;
}

export const Authoring: React.FC<IProps> = ({
  authoredState,
  onAuthoredStateChange,
  authoringType
}) => {
  const config = getAuthoringConfig(authoringType);

  // Track when options should be highlighted (after URL change updates checkboxes)
  const [highlightOptions, setHighlightOptions] = useState(false);

  // Track errors from config callbacks for UI display
  // parseError: shown as field-level validation error on source URL field
  // buildError: shown as dismissible banner above the form
  const [parseError, setParseError] = useState<string | null>(null);
  const [buildError, setBuildError] = useState<string | null>(null);

  // Trigger highlight animation and auto-clear after animation completes
  const triggerOptionsHighlight = useCallback(() => {
    setHighlightOptions(true);
    setTimeout(() => setHighlightOptions(false), 600); // Match CSS animation duration
  }, []);

  // Compute uiSchema dynamically to handle disabled states and conditional visibility
  // Each config can provide its own computeUiSchema function for type-specific logic
  // NOTE: All hooks must be called before any early returns (React rules of hooks)
  const computedUiSchema = useMemo(() => {
    if (!config) return {};
    if (!config.computeUiSchema) {
      return config.uiSchema;
    }

    const currentData = authoredState.authoringConfig?.data || config.initialData || {};
    return config.computeUiSchema(currentData, config.uiSchema || {});
  }, [config, authoredState.authoringConfig?.data]);

  // Get current form data from one of three sources (in priority order):
  // 1. Existing authoringConfig.data (previously saved form state, migrated if needed)
  // 2. Parsed from wrappedInteractiveUrl (editing existing interactive without authoringConfig)
  // 3. config.initialData (brand new interactive)
  const formData = useMemo(() => {
    if (!config) return {};
    let data;

    if (authoredState.authoringConfig?.data) {
      // Use existing form data, migrating if version is older than current
      data = authoredState.authoringConfig.data;
      const savedVersion = authoredState.authoringConfig.version || 1;
      const currentVersion = config.dataVersion || 1;

      if (savedVersion < currentVersion && config.migrateData) {
        try {
          data = config.migrateData(data, savedVersion);
        } catch (e) {
          console.warn(`Failed to migrate config data from v${savedVersion}:`, e);
          // Continue with unmigrated data - better than losing it
        }
      }
    } else if (config.parseUrlToFormData && authoredState.wrappedInteractiveUrl) {
      // Parse existing URL to populate form fields (config-specific)
      try {
        data = config.parseUrlToFormData(authoredState.wrappedInteractiveUrl);
      } catch (e) {
        // Fall back to initial data if parsing fails
        console.warn('Failed to parse existing URL:', e);
        data = config.initialData;
      }
    } else {
      // Fall back to initial data for new interactives
      data = config.initialData;
    }

    // Allow config to inject computed/derived display values
    if (config.computeFormData) {
      return config.computeFormData(data, authoredState);
    }
    return data;
  }, [authoredState, config]);

  // Sync initial form data to authored state when there's a URL param but no saved config.
  // This ensures the runtime has the correct wrappedInteractiveUrl even if the user
  // doesn't make any changes before saving.
  useEffect(() => {
    if (!config) return;

    // Only sync if we have a wrappedInteractiveUrl but no authoringConfig
    const needsInitialSync = authoredState.wrappedInteractiveUrl &&
                              !authoredState.authoringConfig?.data;

    if (!needsInitialSync) return;

    // Build the URL from the parsed form data
    let wrappedInteractiveUrl: string | null | undefined;
    if (config.buildUrl) {
      try {
        wrappedInteractiveUrl = config.buildUrl(formData);
      } catch (e) {
        // Keep original URL if build fails
        wrappedInteractiveUrl = authoredState.wrappedInteractiveUrl;
      }
    } else {
      wrappedInteractiveUrl = authoredState.wrappedInteractiveUrl;
    }

    // Extract disableFullscreen from form data
    const disableFullscreen = config.getDisableFullscreen
      ? config.getDisableFullscreen(formData)
      : !(formData as any).enableFullscreen;

    onAuthoredStateChange({
      ...authoredState,
      wrappedInteractiveUrl: wrappedInteractiveUrl || undefined,
      disableFullscreen,
      authoringConfig: {
        type: authoringType,
        version: config.dataVersion || 1,
        data: formData
      }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run only on mount

  // Compute validation messages from config's validateFormData function
  // Also includes any parse errors from failed URL parsing
  // These are displayed as non-blocking warnings/errors below fields
  const extraErrors = useMemo(() => {
    if (!config) return undefined;

    // Start with validation from config
    let validation: IValidationResult = {};
    if (config.validateFormData) {
      validation = config.validateFormData(formData);
    }

    // Merge in parse error if present (shows on source URL field)
    if (parseError && config.sourceUrlField) {
      validation = {
        ...validation,
        [config.sourceUrlField]: {
          message: parseError,
          severity: 'error'
        }
      };
    }

    if (Object.keys(validation).length === 0) {
      return undefined;
    }
    return convertToExtraErrors(validation);
  }, [config, formData, parseError]);

  // handleChange needs to be defined as a callback that uses config
  const handleChange = useCallback(({ formData: newFormData }: any) => {
    if (!config) return;
    let updatedFormData = newFormData;

    // If config defines a source URL field, check if it changed and re-parse if so.
    // This updates other form fields (like checkboxes) to reflect the new URL's settings.
    // NOTE: This intentionally overwrites manual changes when the source URL changes.
    // Rationale: The source URL is the "ground truth" - when an author pastes a new URL,
    // they expect the form to reflect that URL's current settings.
    if (config.sourceUrlField && config.parseUrlToFormData) {
      const field = config.sourceUrlField;
      // Compare against authoredState directly to avoid stale closure issues
      const currentSourceUrl = authoredState.authoringConfig?.data?.[field] || '';
      const newSourceUrl = newFormData[field] || '';

      if (newSourceUrl && newSourceUrl !== currentSourceUrl) {
        // Source URL changed - parse it to get updated form field values
        try {
          const parsedData = config.parseUrlToFormData(newSourceUrl);
          updatedFormData = {
            ...parsedData,
            [field]: newSourceUrl  // Ensure the source URL field is set
          };
          // Clear any previous parse error on success
          setParseError(null);
          // Trigger visual feedback so author notices the fields updated
          triggerOptionsHighlight();
        } catch (e) {
          // Show parse error as field-level validation on the source URL field
          setParseError(getErrorMessage(e, 'Failed to parse URL'));
          // Continue with the raw form data (don't block the change)
        }
      }
    }

    // Calculate the final wrapped interactive URL
    let wrappedInteractiveUrl: string | null | undefined;
    if (config.buildUrl) {
      try {
        wrappedInteractiveUrl = config.buildUrl(updatedFormData);
        // Clear any previous build error on success
        setBuildError(null);
      } catch (e) {
        // Show build error in a dismissible banner
        setBuildError(`Error generating URL: ${getErrorMessage(e, 'Failed to build URL')}`);
        // Keep the previous URL if build fails
        wrappedInteractiveUrl = authoredState.wrappedInteractiveUrl;
      }
    } else {
      // Fallback for configs without buildUrl (edge case - all standard configs should define buildUrl)
      wrappedInteractiveUrl = authoredState.wrappedInteractiveUrl;
    }

    // Extract disableFullscreen from form data (config-specific or default to enableFullscreen field)
    const disableFullscreen = config.getDisableFullscreen
      ? config.getDisableFullscreen(updatedFormData)
      : !updatedFormData.enableFullscreen;

    onAuthoredStateChange({
      ...authoredState,
      wrappedInteractiveUrl: wrappedInteractiveUrl || undefined,
      disableFullscreen,
      authoringConfig: {
        type: authoringType,
        version: config.dataVersion || 1,
        data: updatedFormData
      }
    });
  }, [config, authoredState, authoringType, onAuthoredStateChange, triggerOptionsHighlight]);

  // Early return AFTER all hooks have been called
  if (!config) {
    return (
      <div className={css.error}>
        Unknown authoring type: {authoringType}
      </div>
    );
  }

  // Combine class names for highlight effect
  const formClassName = highlightOptions
    ? `${css.formContainer} ${css.highlightOptions}`
    : css.formContainer;

  return (
    <div className={css.authoring}>
      {/* Dismissible error banner for URL build failures */}
      {buildError && (
        <div className={css.errorBanner} role="alert">
          <span>{buildError}</span>
          <button
            type="button"
            onClick={() => setBuildError(null)}
            className={css.dismissButton}
            aria-label="Dismiss error"
          >
            ×
          </button>
        </div>
      )}

      <div className={formClassName}>
        <Form
          schema={config.schema}
          uiSchema={computedUiSchema}
          formData={formData}
          validator={validator}
          onChange={handleChange}
          templates={{ FieldErrorTemplate, ObjectFieldTemplate }}  // Custom templates
          liveValidate={false}
          extraErrors={extraErrors}
          showErrorList={false}  // Don't show error list at top, just inline
        >
          <div /> {/* Hide default submit button */}
        </Form>
      </div>
    </div>
  );
};
