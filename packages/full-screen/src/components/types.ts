import { IAuthoringInteractiveMetadata, IRuntimeInteractiveMetadata } from "@concord-consortium/lara-interactive-api";
import { RJSFSchema, UiSchema } from "@rjsf/utils";

/**
 * Authoring configuration for specific interactive types.
 * Each interactive type (CODAP, Sage, etc.) provides its own config
 * that defines the form schema and callbacks for URL building/parsing.
 *
 * @typeParam TFormData - The shape of form data for this config type.
 *                        Defaults to `any` for flexibility, but can be
 *                        specified for full type safety (e.g., ICodapAuthoringData).
 *
 * @example
 * // With explicit type parameter for full type safety:
 * const codapConfig: IAuthoringConfig<ICodapAuthoringData> = { ... };
 *
 * // Without type parameter (uses any):
 * const genericConfig: IAuthoringConfig = { ... };
 */
export interface IAuthoringConfig<TFormData = any> {
  /** Unique identifier for this config type (e.g., 'codap', 'sage', 'generic') */
  type: string;

  /** JSON Schema defining the form fields for this interactive type */
  schema: RJSFSchema;

  /** RJSF UI schema for customizing field rendering (widgets, options, etc.) */
  uiSchema?: UiSchema;

  /** Default values for form fields when creating a new interactive */
  initialData?: TFormData;

  /**
   * Computes dynamic uiSchema based on current form data.
   * Used for conditional field states (disabled, hidden) that depend on other field values.
   * @param formData - Current form data
   * @param baseUiSchema - The static uiSchema from this config
   * @returns Modified uiSchema with dynamic properties applied
   * @example (formData, baseUiSchema) => ({ ...baseUiSchema, someField: { "ui:disabled": !formData.enableIt } })
   */
  computeUiSchema?: (formData: TFormData, baseUiSchema: UiSchema) => UiSchema;

  /**
   * Parses an existing URL into form data.
   * Used when editing an interactive that has a wrappedInteractiveUrl but no authoringConfig.data
   * (e.g., an interactive created before the authoring feature existed).
   * @param url - The existing wrapped interactive URL to parse
   * @returns Form data object populated from URL parameters
   */
  parseUrlToFormData?: (url: string) => TFormData;

  /**
   * Computes derived/display values for form data.
   * Called after base form data is determined, allows injecting read-only computed fields.
   * @param formData - Current form data
   * @param authoredState - Current authored state (for accessing wrappedInteractiveUrl, etc.)
   * @returns Form data with computed fields added
   * @example Injecting a "generatedUrl" or "passthroughParamsDisplay" field for display
   */
  computeFormData?: (formData: TFormData, authoredState: IAuthoredState) => TFormData;

  /**
   * Builds the final URL from form data.
   * Called on form change to generate the wrappedInteractiveUrl for authoredState.
   * @param formData - Current form data
   * @returns The complete URL string, or null if URL cannot be built
   */
  buildUrl?: (formData: TFormData) => string | null;

  /**
   * Field name that contains the "source URL" for re-parsing detection.
   * When this field changes, parseUrlToFormData is called to update other form fields.
   * @example 'codapSourceDocumentUrl' for CODAP config
   */
  sourceUrlField?: keyof TFormData & string;

  /**
   * Extracts the disableFullscreen value from form data.
   * @param formData - Current form data
   * @returns true if fullscreen should be disabled, false otherwise
   * @example (formData) => !formData.displayFullscreenButton
   */
  getDisableFullscreen?: (formData: TFormData) => boolean;

  /**
   * Validates form data and returns warnings/errors for display.
   * Results are shown as inline messages below the relevant fields.
   * @param formData - Current form data to validate
   * @returns Object mapping field paths to validation messages
   * @example { 'codapSourceDocumentUrl': { message: 'Not a CODAP link', severity: 'warning' } }
   */
  validateFormData?: (formData: TFormData) => IValidationResult;

  /**
   * Current version of this config's data schema.
   * Stored in authoringConfig.version when saving.
   * Used to determine if migration is needed when loading.
   * @default 1
   */
  dataVersion?: number;

  /**
   * Migrates old config data to the current version.
   * Called when loading data with a version older than dataVersion.
   * @param data - The old data to migrate
   * @param fromVersion - The version the data was saved with
   * @returns Migrated data compatible with current TFormData shape
   * @example
   * migrateData: (data, fromVersion) => {
   *   if (fromVersion < 2) {
   *     // v1 -> v2: renamed 'url' to 'sourceUrl'
   *     return { ...data, sourceUrl: data.url };
   *   }
   *   return data;
   * }
   */
  migrateData?: (data: any, fromVersion: number) => TFormData;
}

/**
 * A single validation message with severity level.
 */
export interface IValidationMessage {
  /** The message to display to the user */
  message: string;
  /** 'warning' for non-blocking hints, 'error' for blocking issues */
  severity: 'warning' | 'error';
}

/**
 * Result from validateFormData callback.
 * Maps field paths (e.g., 'fieldName' or 'nested.fieldName') to validation messages.
 */
export interface IValidationResult {
  [fieldPath: string]: IValidationMessage;
}

// CODAP-specific authoring config data
export interface ICodapAdvancedOptions {
  enableDi: boolean;
  diPluginUrl: string;
  enableDiOverride: boolean;
  diOverrideValue: string;
  enableGuideIndex: boolean;
  guideIndexValue: number;
  enableCustomParams: boolean;
  customParamsValue: string;
  // Read-only, calculated field showing the final URL.
  // Uses empty string (not undefined) for RJSF compatibility.
  generatedUrl: string;
}

export interface ICodapAuthoringData {
  codapSourceDocumentUrl: string;
  displayFullscreenButton: boolean;
  displayDataVisibilityToggles: boolean;
  displayAllComponentsAlways: boolean;
  removeToolbarsAndGrid: boolean;
  lockComponents: boolean;
  advancedOptions: ICodapAdvancedOptions;
}

// Generic authoring config data (fallback)
// Note: Uses 'sourceUrl' (not 'wrappedInteractiveUrl') for conceptual symmetry
// with CODAP's 'codapSourceDocumentUrl'. The buildUrl callback returns this
// value to populate authoredState.wrappedInteractiveUrl.
export interface IGenericAuthoringData {
  sourceUrl: string;
  enableFullscreen: boolean;
}

export interface IAuthoredState extends IAuthoringInteractiveMetadata {
  // Version is required for new states. Legacy states without version are migrated.
  // See migrateAuthoredState() in the Migration section.
  version: 1;
  hint?: string;
  wrappedInteractiveUrl?: string; // The final calculated URL to use at runtime
  // NOTE: Named as negative boolean ("disable" rather than "enable") intentionally.
  // When undefined (no authored state, e.g., runtime-only mode), fullscreen is ENABLED by default.
  // This preserves backward compatibility: existing URLs without authored state get fullscreen.
  // Only when explicitly set to true does fullscreen get disabled.
  //
  // Usage pattern:
  //   const fullscreenDisabled = authoredState?.disableFullscreen === true;
  //   // AVOID: const fullscreenEnabled = !authoredState?.disableFullscreen; // Wrong! undefined !== false
  disableFullscreen?: boolean;
  // Authoring configuration specific to the wrapped interactive type
  authoringConfig?: {
    type: string; // 'codap', 'generic', etc.
    version: number; // Config-specific data version for migrations
    data: ICodapAuthoringData | IGenericAuthoringData | any;
  };
}

export interface IInteractiveState extends IRuntimeInteractiveMetadata {
  subinteractiveStates: {
    [id: string]: any;
  };
  currentSubinteractiveId: string;
  submitted: boolean;
}
