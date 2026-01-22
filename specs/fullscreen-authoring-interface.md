# Full Screen Interactive - CODAP Authoring Interface Specification

**Repository:** https://github.com/concord-consortium/question-interactives/tree/master/packages/full-screen

## Overview

This specification outlines the addition of a specialized authoring interface to the Full Screen interactive for CODAP (and extensible to other interactives in the future). Currently, the Full Screen interactive only works in runtime mode with a URL parameter (`?wrappedInteractive=<url>`). This enhancement adds an authoring layer that displays a React JSON Schema Form when LARA opens the interactive in authoring mode.

### Why Add CODAP Authoring to the Full Screen Interactive?

The Full Screen interactive is the natural home for CODAP authoring for several reasons:

1. **CODAP requires fullscreen mode in Activity Player** - CODAP's interface is not usable within the constrained layout of Activity Player. The fullscreen capability provided by this interactive is essential for CODAP to function properly, allowing users to expand CODAP to fill the screen where they can effectively work with data.

2. **Avoiding complex runtime switching** - A separate standalone CODAP interactive would need to implement complex logic to switch to the Full Screen interactive when users want fullscreen mode, then switch back when they don't. This would create unnecessary complexity.

3. **Existing usage patterns** - Most, if not all, CODAP URLs embedded in Activity Player already use the Full Screen interactive. Adding authoring here serves the existing workflow rather than requiring authors to migrate to a new interactive type.

4. **Automatic enablement for existing content** - Adding authoring support here automatically enables it for all existing Full Screen CODAP interactives. When authors open an existing interactive for editing, the form is pre-populated by parsing the current URL, allowing them to modify settings without manually updating the url.

5. **Support for other interactives** - The generic fallback authoring interface supports other Full Screen interactives like SageModeler. While CODAP gets a specialized form with CODAP-specific options, any wrapped interactive can be configured with basic settings (URL and fullscreen toggle) through the generic form.

6. **New flexibility for non-fullscreen embedding** - As part of this work, the Full Screen interactive gains a new option to disable the fullscreen button and scaling. This allows authors to embed a non-scaled CODAP interactive (or any other interactive) when fullscreen mode isn't needed, making the Full Screen interactive a versatile wrapper for any URL-based interactive.

### Authoring Form Selection

The authoring form displayed depends on:
1. **CODAP form**: Used when `?authoring=codap` is present, OR when the wrapped URL is auto-detected as a CODAP URL
2. **Generic form**: Used in all other cases (fallback)

This approach differs from other container interactives by:
- Not using a library interactive dropdown (other containers let authors pick from a list of pre-configured interactives; Full Screen instead accepts any URL directly)
- Keeping the existing URL-based workflow as primary
- Adding optional inline authoring for specific interactive types
- Using the same React JSON Schema Form infrastructure used throughout this repository

## Product Owner Overview

### What This Feature Does

This feature adds a user-friendly authoring interface for curriculum authors who need to configure CODAP interactives within the Full Screen wrapper. Instead of manually constructing complex URLs with multiple parameters, authors can use a simple form with checkboxes and text fields to configure how CODAP behaves when embedded in curriculum materials.

### Why the Full Screen Interactive?

CODAP interactives in Activity Player are almost always wrapped in the Full Screen interactive because:

- **CODAP needs room to work** - CODAP's data visualization interface isn't usable within Activity Player's constrained layout. The fullscreen capability lets students expand CODAP to fill the screen where they can effectively drag components, resize tables, and work with graphs.

- **It's already the standard** - Most CODAP URLs in Activity Player already use the Full Screen interactive. Adding authoring here serves existing workflows without requiring content migration.

- **Simpler than the alternative** - A separate CODAP interactive would need complex logic to switch between fullscreen and non-fullscreen modes at runtime, creating maintenance burden and potential bugs.

- **Instant support for existing content** - All existing Full Screen CODAP interactives automatically get authoring support. When you open one for editing, the form is pre-populated from the current URL.

- **Works for other interactives too** - The generic fallback form supports other Full Screen interactives like SageModeler with basic URL and fullscreen settings.

**New in this release:** Authors can now disable fullscreen mode entirely, allowing the Full Screen interactive to serve as a simple URL wrapper when scaling and fullscreen aren't needed.

### The Problem We're Solving

Currently, curriculum authors who want to customize CODAP behavior (e.g., hide toolbars, lock components, add plugins) must:
1. Understand the technical URL parameter syntax
2. Manually edit long, encoded URLs
3. Remember which parameters are available and what they do
4. Test by trial and error to verify the URL works correctly

This is error-prone, time-consuming, and requires technical knowledge that many authors don't have.

### The Solution

When authors open a Full Screen interactive in LARA's authoring mode, they'll see a form with:
- **A URL input field** where they paste their CODAP document link
- **Checkboxes** for common display options (fullscreen button, visibility toggles, component locking, etc.)
- **Advanced options** for power users (custom plugins, guide index, additional parameters)
- **A generated URL preview** showing the final URL that will be used

The form automatically:
- Parses existing URLs to pre-populate checkbox states
- Validates URLs and shows helpful warnings
- Generates the correct URL with all selected options
- Saves the configuration for use at runtime

### Key Benefits

1. **Reduced errors** - No more typos in URL parameters or incorrect encoding
2. **Discoverability** - Authors can see all available options at a glance
3. **Self-documenting** - Each option has a description explaining what it does
4. **Faster authoring** - Configure CODAP in seconds instead of minutes
5. **Backward compatible** - Existing interactives continue to work unchanged

### Who This Is For

- **Curriculum authors** who embed CODAP in LARA activities
- **Content developers** who need to customize CODAP display settings
- **QA testers** who verify CODAP configurations

### Generic Fallback Mode

When LARA opens the Full Screen interactive in authoring mode, the system automatically selects the appropriate authoring form:

- **CODAP form** is used when:
  - The URL parameter `?authoring=codap` is present (explicit override), OR
  - The wrapped URL is auto-detected as a CODAP URL

- **Generic form** is used in all other cases, providing:
  - A text area to enter or edit the wrapped interactive URL
  - A checkbox to enable/disable fullscreen mode

This allows authors to configure any interactive with basic fullscreen settings, even if there's no specialized form for that interactive type.

### Future Extensibility

While this initial implementation focuses on CODAP, the architecture supports adding similar authoring interfaces for other interactive types (Sage, NetLogo, etc.) in the future. Each new interactive type would get its own specialized form with options relevant to that interactive.

## Current State

The Full Screen interactive currently:
- Has no authoring interface
- Receives the wrapped interactive URL via query string parameter (`?wrappedInteractive=<url>`)
- Only displays a runtime view that wraps a single interactive in full-screen mode with scaling
- Has a minimal `IInteractiveState` interface that tracks subinteractive states

**Current Files:**
- `packages/full-screen/src/components/app.tsx` - Simple wrapper that renders Runtime only
- `packages/full-screen/src/components/runtime.tsx` - Full screen runtime logic
- `packages/full-screen/src/components/types.ts` - Type definitions
- `packages/full-screen/src/components/full-screen-button.tsx` - Full screen toggle button

**Query String Parameters:**
- `wrappedInteractive` - URL of the interactive to wrap (required)

## Proposed Changes

### 1. Authoring URL Parameter Support

**Note:** LARA determines whether the interactive is in authoring or runtime mode. The `?authoring` URL parameter only controls which authoring configuration (form) is displayed.

**Query Parameter:**
- `authoring` - Optional parameter to override authoring form selection
  - Value: `codap` - Force CODAP-specific authoring form (even for non-CODAP URLs)
  - No value - Auto-detect based on wrapped URL (CODAP URLs get CODAP form, others get generic)

**Example URLs:**
```
# CODAP URL - auto-detected, displays CODAP authoring form
?wrappedInteractive=https://codap.concord.org/app/static/dg/en/cert/index.html

# Non-CODAP URL - displays generic authoring form
?wrappedInteractive=https://some-interactive.com

# Force CODAP authoring form for non-CODAP URL (explicit override)
?wrappedInteractive=https://example.com&authoring=codap
```

### 2. Pattern Matching for Authoring Config Selection

URL pattern matching automatically selects the CODAP authoring configuration when the wrapped URL is detected as a CODAP URL. The `detectInteractiveType()` utility function (see [utils/detect-interactive-type.ts](#utilsdetect-interactive-typets)) handles this detection.

**Authoring config selection logic:**
1. `?authoring=codap` → Always use CODAP config (explicit override)
2. Wrapped URL detected as CODAP → Use CODAP config (auto-detect)
3. Everything else → Use generic config (fallback)

### 3. Update Type Definitions (`types.ts`)

Add type definitions for authoring configurations:

```typescript
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
}

export interface ICodapAuthoringData {
  codapSourceDocumentUrl: string;
  displayFullscreenButton: boolean;
  displayDataVisibilityToggles: boolean;
  displayAllComponentsAlways: boolean;
  removeToolbarsAndGrid: boolean;
  lockComponents: boolean;
  advancedOptions: ICodapAdvancedOptions;
  // Read-only, calculated field showing the final URL.
  // Uses empty string (not undefined) for RJSF compatibility - undefined would
  // cause the field to be omitted from formData, while empty string ensures
  // the field is always present and renders as an empty textarea.
  generatedUrl: string;
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
  version: 1;
  hint?: string;
  wrappedInteractiveUrl?: string; // The final calculated URL to use at runtime
  // NOTE: Named as negative boolean ("disable" rather than "enable") intentionally.
  // When undefined (no authored state, e.g., runtime-only mode), fullscreen is ENABLED by default.
  // This preserves backward compatibility: existing URLs without authored state get fullscreen.
  // Only when explicitly set to true does fullscreen get disabled.
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
```

### 4. Create Authoring Configurations (`authoring-configs/`)

Create a new directory `packages/full-screen/src/authoring-configs/` with configuration files for each interactive type:

The CODAP authoring configuration is split into three files for better organization and maintainability:
- `codap-url-utils.ts` - URL parsing and building utilities
- `codap-schema.ts` - Form schema, uiSchema, and initial data
- `codap-config.ts` - Assembly and configuration object

**`authoring-configs/codap-url-utils.ts`:**

This file contains all URL parsing and building utilities for CODAP URLs. These are pure functions with no dependencies on form state or configuration.

```typescript
/**
 * Parsed CODAP URL information
 */
export interface IParsedCodapUrl {
  baseUrl: string;
  documentId: string | null;
  passthroughParams: Record<string, string>;
  formatType: 'shared-hash' | 'interactive-api' | 'full-screen-wrapped' | 'unknown';
}

// Parameters handled by the form - not passed through from original URL
const HANDLED_PARAMS = new Set([
  'interactiveApi', 'documentId', 'url', 'shared',
  'app', 'inbounds', 'embeddedMode', 'componentMode',
  'di', 'di-override', 'guideIndex'
]);

const extractPassthroughParams = (searchParams: URLSearchParams): Record<string, string> => {
  const passthrough: Record<string, string> = {};
  searchParams.forEach((value, key) => {
    if (!HANDLED_PARAMS.has(key)) {
      passthrough[key] = value;
    }
  });
  return passthrough;
};

/**
 * Parses a full-screen wrapped CODAP URL (recursive helper)
 */
const parseFullScreenWrappedUrl = (inputUrl: string): IParsedCodapUrl => {
  try {
    const url = new URL(inputUrl);
    const wrappedInteractive = url.searchParams.get('wrappedInteractive');
    if (!wrappedInteractive) {
      return { baseUrl: '', documentId: null, passthroughParams: {}, formatType: 'full-screen-wrapped' };
    }
    const decodedWrapped = decodeURIComponent(wrappedInteractive);
    const parsed = parseCodapUrl(decodedWrapped);
    return { ...parsed, formatType: 'full-screen-wrapped' };
  } catch (e) {
    return { baseUrl: '', documentId: null, passthroughParams: {}, formatType: 'full-screen-wrapped' };
  }
};

/**
 * Parses various CODAP URL formats and extracts the base URL and document ID.
 * Supports: shared hash, interactiveApi, full-screen wrapped, and legacy formats.
 *
 * EDGE CASES AND AMBIGUOUS INPUTS:
 * - Multiple documentId params: Uses first value only (URLSearchParams.get behavior)
 * - Both shared= (hash) AND documentId (query): shared= takes precedence (checked first)
 * - Malformed hash (no valid shared=): Falls through to query param checks
 * - Invalid URL syntax: Returns inputUrl as baseUrl with formatType 'unknown'
 * - Empty/whitespace URL: Returns empty result with formatType 'unknown'
 * - URL with only base (no doc ID): Returns baseUrl with null documentId
 *
 * PRECEDENCE ORDER:
 * 1. Full-screen wrapped URL (recursive unwrap)
 * 2. Hash fragment with shared= (CODAP shared links)
 * 3. Query param documentId= (interactiveApi format)
 * 4. Query param url= (legacy format)
 * 5. Unknown format (base URL only)
 */
export const parseCodapUrl = (inputUrl: string): IParsedCodapUrl => {
  if (!inputUrl) {
    return { baseUrl: '', documentId: null, passthroughParams: {}, formatType: 'unknown' };
  }

  try {
    if (inputUrl.includes('full-screen') && inputUrl.includes('wrappedInteractive=')) {
      return parseFullScreenWrappedUrl(inputUrl);
    }

    const url = new URL(inputUrl);
    const baseUrl = `${url.origin}${url.pathname}`;
    const passthroughParams = extractPassthroughParams(url.searchParams);

    // Check for hash fragment with shared= (CODAP shared links)
    if (url.hash && url.hash.includes('shared=')) {
      const hashParams = new URLSearchParams(url.hash.slice(1));
      const sharedUrl = hashParams.get('shared');
      return {
        baseUrl,
        documentId: sharedUrl ? decodeURIComponent(sharedUrl) : null,
        passthroughParams,
        formatType: 'shared-hash'
      };
    }

    // Check for interactiveApi format with documentId
    if (url.searchParams.has('documentId')) {
      const documentId = url.searchParams.get('documentId');
      return {
        baseUrl,
        documentId: documentId ? decodeURIComponent(documentId) : null,
        passthroughParams,
        formatType: 'interactive-api'
      };
    }

    // Check for url= parameter (legacy format)
    if (url.searchParams.has('url')) {
      const docUrl = url.searchParams.get('url');
      return {
        baseUrl,
        documentId: docUrl ? decodeURIComponent(docUrl) : null,
        passthroughParams,
        formatType: 'interactive-api'
      };
    }

    return { baseUrl, documentId: null, passthroughParams, formatType: 'unknown' };
  } catch (e) {
    return { baseUrl: inputUrl, documentId: null, passthroughParams: {}, formatType: 'unknown' };
  }
};

/**
 * Parses custom params string into URLSearchParams.
 */
export const parseCustomParams = (customParamsValue: string | undefined): URLSearchParams | null => {
  if (!customParamsValue?.trim()) return null;

  let paramsString = customParamsValue.trim()
    .replace(/^\?+/, '')
    .replace(/\r?\n/g, '&')
    .replace(/^&+/, '')
    .replace(/&+$/, '')
    .replace(/&{2,}/g, '&');

  if (!paramsString) return null;

  try {
    return new URLSearchParams(paramsString);
  } catch (e) {
    return null;
  }
};

/**
 * Gets filtered passthrough params from a source URL.
 * Filters out params that will be overridden by custom params.
 */
export const getFilteredPassthroughParams = (
  sourceUrl: string | undefined,
  customParamsValue: string | undefined,
  enableCustomParams: boolean
): Record<string, string> => {
  if (!sourceUrl) return {};

  const parsed = parseCodapUrl(sourceUrl);
  const passthrough = parsed.passthroughParams || {};

  if (!enableCustomParams) return passthrough;

  const customKeys = new Set<string>();
  const customParsed = parseCustomParams(customParamsValue);
  if (customParsed) {
    customParsed.forEach((_, key) => { if (key) customKeys.add(key); });
  }

  const filtered: Record<string, string> = {};
  Object.entries(passthrough).forEach(([key, value]) => {
    if (!customKeys.has(key)) {
      filtered[key] = value;
    }
  });
  return filtered;
};

/**
 * Formats passthrough params for display in the form.
 */
export const formatPassthroughParamsDisplay = (params: Record<string, string>): string => {
  const entries = Object.entries(params);
  if (entries.length === 0) return '';
  return entries.map(([key, value]) => `${key} = ${value}`).join('\n');
};

/**
 * Builds a CODAP URL with parameters from authoring config.
 */
export const buildCodapUrl = (data: any): string | null => {
  const sourceUrl = data.codapSourceDocumentUrl;
  if (!sourceUrl) return null;

  const parsed = parseCodapUrl(sourceUrl);
  if (!parsed.baseUrl) return null;

  const url = new URL(parsed.baseUrl);

  // Add interactiveApi parameter for LARA integration
  url.searchParams.set('interactiveApi', '');

  if (parsed.documentId) {
    url.searchParams.set('documentId', parsed.documentId);
  }

  // Apply CODAP Options from form checkboxes
  if (data.displayDataVisibilityToggles) url.searchParams.set('app', 'is');
  if (data.displayAllComponentsAlways) url.searchParams.set('inbounds', 'true');
  if (data.removeToolbarsAndGrid) url.searchParams.set('embeddedMode', 'yes');
  if (data.lockComponents) url.searchParams.set('componentMode', 'yes');

  // Apply Advanced Options
  const advanced = data.advancedOptions || {};
  if (advanced.enableDi && advanced.diPluginUrl) url.searchParams.set('di', advanced.diPluginUrl);
  if (advanced.enableDiOverride && advanced.diOverrideValue) url.searchParams.set('di-override', advanced.diOverrideValue);
  if (advanced.enableGuideIndex && advanced.guideIndexValue !== undefined) {
    url.searchParams.set('guideIndex', String(advanced.guideIndexValue));
  }

  // Add passthrough params (before custom params)
  Object.entries(parsed.passthroughParams).forEach(([key, value]) => {
    if (!url.searchParams.has(key)) url.searchParams.set(key, value);
  });

  // Custom params (override everything)
  if (advanced.enableCustomParams) {
    const customSearchParams = parseCustomParams(advanced.customParamsValue);
    if (customSearchParams) {
      customSearchParams.forEach((value, key) => {
        if (key) url.searchParams.set(key, value);
      });
    }
  }

  return url.toString();
};

/**
 * Parses an existing CODAP URL and extracts form field values.
 * Used when editing an interactive that has a URL but no saved authoringConfig.
 */
export const parseCodapUrlToFormData = (existingUrl: string): any => {
  try {
    const url = new URL(existingUrl);
    const params = url.searchParams;

    return {
      codapSourceDocumentUrl: existingUrl,
      displayFullscreenButton: true,
      displayDataVisibilityToggles: params.get('app') === 'is',
      displayAllComponentsAlways: params.get('inbounds') === 'true',
      removeToolbarsAndGrid: params.get('embeddedMode') === 'yes',
      lockComponents: params.get('componentMode') === 'yes',
      advancedOptions: {
        enableDi: !!params.get('di'),
        diPluginUrl: params.get('di') || '',
        enableDiOverride: !!params.get('di-override'),
        diOverrideValue: params.get('di-override') || '',
        enableGuideIndex: !!params.get('guideIndex'),
        guideIndexValue: params.get('guideIndex') ? parseInt(params.get('guideIndex')!, 10) : 0,
        enableCustomParams: false,
        customParamsValue: ''
      }
    };
  } catch (e) {
    // Error case: URL couldn't be parsed (malformed, not a URL, etc.)
    // Only displayFullscreenButton defaults to true (users expect fullscreen).
    // All other CODAP options default to false - let the author configure them
    // explicitly rather than assuming what they want.
    return {
      codapSourceDocumentUrl: existingUrl,
      displayFullscreenButton: true,
      displayDataVisibilityToggles: false,
      displayAllComponentsAlways: false,
      removeToolbarsAndGrid: false,
      lockComponents: false,
      advancedOptions: {
        enableDi: false, diPluginUrl: '',
        enableDiOverride: false, diOverrideValue: '',
        enableGuideIndex: false, guideIndexValue: 0,
        enableCustomParams: false, customParamsValue: ''
      }
    };
  }
};
```

**`authoring-configs/codap-schema.ts`:**

This file contains the JSON Schema definition, uiSchema, and initial data for the CODAP authoring form.

```typescript
import { RJSFSchema } from "@rjsf/utils";

/**
 * Initial/default data for CODAP authoring form.
 * Defined first so schema can reference these values (DRY - single source of truth).
 */
export const codapInitialData = {
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
    customParamsValue: ""
  },
  // Read-only, calculated field showing the final URL.
  // Uses empty string (not undefined) for RJSF compatibility.
  generatedUrl: ""
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
      description: "Paste a CODAP shared link, full-screen wrapped URL, or interactiveApi URL. The system will parse and convert it automatically."
    },

    // CODAP Options section
    displayFullscreenButton: {
      title: "Display fullscreen button",
      type: "boolean",
      default: codapInitialData.displayFullscreenButton,
      description: "Allows users to open CODAP in fullscreen by clicking fullscreen button"
    },
    displayDataVisibilityToggles: {
      title: "Display data visibility toggles on graphs (app=is)",
      type: "boolean",
      default: codapInitialData.displayDataVisibilityToggles,
      description: "Allows users to use toggles on graphs to control which data is visible"
    },
    displayAllComponentsAlways: {
      title: "Display all components always & prevent scrolling (inbounds=true)",
      type: "boolean",
      default: codapInitialData.displayAllComponentsAlways,
      description: "Keeps components displayed inside the browser window, even when displayed in smaller browser windows (users will not see horizontal or vertical scroll bars on the browser window when browser is resized)"
    },
    removeToolbarsAndGrid: {
      title: "Remove toolbars & background grid (embeddedMode=yes)",
      type: "boolean",
      default: codapInitialData.removeToolbarsAndGrid,
      description: "Removes toolbars and background grid; all components remain moveable"
    },
    lockComponents: {
      title: "Lock components (componentMode=yes)",
      type: "boolean",
      default: codapInitialData.lockComponents,
      description: "Locks position of components and prevents the user from moving them around the canvas (also removes toolbars)"
    },

    // Advanced CODAP Options (collapsible)
    advancedOptions: {
      title: "Advanced CODAP Options",
      type: "object",
      properties: {
        enableDi: {
          title: "di",
          type: "boolean",
          default: codapInitialData.advancedOptions.enableDi,
          description: "Requires a string specifying the URL of a plugin to load"
        },
        diPluginUrl: {
          title: "Plugin URL",
          type: "string"
        },
        enableDiOverride: {
          title: "di-override",
          type: "boolean",
          default: codapInitialData.advancedOptions.enableDiOverride,
          description: "Requires a string value that is a substring of the current DI to be replaced, used in conjunction with di parameter"
        },
        diOverrideValue: {
          title: "value",
          type: "string"
        },
        enableGuideIndex: {
          title: "guideIndex",
          type: "boolean",
          default: codapInitialData.advancedOptions.enableGuideIndex,
          description: "Requires an integer which specifies the number of guide page to show on load; default is 0 (first page)"
        },
        guideIndexValue: {
          title: "value",
          type: "integer",
          default: codapInitialData.advancedOptions.guideIndexValue
        },
        enableCustomParams: {
          title: "Custom URL parameters",
          type: "boolean",
          default: codapInitialData.advancedOptions.enableCustomParams,
          description: "Enter additional CODAP URL parameters. Supports query string format (key1=value1&key2=value2) or one key=value pair per line."
        },
        customParamsValue: {
          title: "",
          type: "string",
          description: "Examples: 'foo=bar&baz=qux' or newline-separated 'foo=bar' on each line"
        },
        // Passthrough params display (read-only, computed from source URL)
        // Only displayed when there are passthrough params
        passthroughParamsDisplay: {
          title: "Passthrough Parameters",
          type: "string",
          readOnly: true,
          description: "These parameters from the source URL will be included in the generated URL (not controlled by form options above)"
        }
      }
    },

    // Generated URL (read-only, calculated)
    generatedUrl: {
      title: "Generated URL",
      type: "string",
      readOnly: true,
      description: "The final URL that will be used for this CODAP interactive (read-only)"
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
export const codapUiSchema = {
  codapSourceDocumentUrl: {
    "ui:widget": "textarea",
    "ui:options": {
      rows: 3
    },
    "ui:placeholder": "Paste CODAP shared link or document URL here..."
  },
  displayFullscreenButton: {
    "ui:widget": "checkbox"
  },
  displayDataVisibilityToggles: {
    "ui:widget": "checkbox"
  },
  displayAllComponentsAlways: {
    "ui:widget": "checkbox"
  },
  removeToolbarsAndGrid: {
    "ui:widget": "checkbox"
  },
  lockComponents: {
    "ui:widget": "checkbox"
  },
  advancedOptions: {
    "ui:options": {
      collapsible: true,
      collapsed: true
    },
    diPluginUrl: {
      "ui:disabled": true  // Default; overridden by computeUiSchema
    },
    diOverrideValue: {
      "ui:disabled": true  // Default; overridden by computeUiSchema
    },
    guideIndexValue: {
      "ui:disabled": true  // Default; overridden by computeUiSchema
    },
    customParamsValue: {
      "ui:widget": "textarea",
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
    "ui:order": [
      "enableDi",
      "diPluginUrl",
      "enableDiOverride",
      "diOverrideValue",
      "enableGuideIndex",
      "guideIndexValue",
      "enableCustomParams",
      "customParamsValue",
      "passthroughParamsDisplay"
    ]
  },
  generatedUrl: {
    "ui:widget": "textarea",
    "ui:readonly": true,
    "ui:options": {
      rows: 3
    }
  },
  "ui:order": [
    "codapSourceDocumentUrl",
    "displayFullscreenButton",
    "displayDataVisibilityToggles",
    "displayAllComponentsAlways",
    "removeToolbarsAndGrid",
    "lockComponents",
    "advancedOptions",
    "generatedUrl"
  ]
};
```

**`authoring-configs/codap-config.ts`:**

This file assembles the CODAP authoring configuration by importing from the utility and schema files.

```typescript
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
  computeUiSchema: (formData: any, baseUiSchema: any) => {
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
      advancedOptions: {
        ...baseUiSchema.advancedOptions,
        diPluginUrl: {
          ...baseUiSchema.advancedOptions?.diPluginUrl,
          "ui:disabled": !advanced.enableDi
        },
        diOverrideValue: {
          ...baseUiSchema.advancedOptions?.diOverrideValue,
          "ui:disabled": !advanced.enableDiOverride
        },
        guideIndexValue: {
          ...baseUiSchema.advancedOptions?.guideIndexValue,
          "ui:disabled": !advanced.enableGuideIndex
        },
        customParamsValue: {
          ...baseUiSchema.advancedOptions?.customParamsValue,
          "ui:disabled": !advanced.enableCustomParams
        },
        passthroughParamsDisplay: {
          ...baseUiSchema.advancedOptions?.passthroughParamsDisplay,
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
  getDisableFullscreen: (formData: any) => !formData.displayFullscreenButton,

  // Validate form data and return warnings/errors for display
  // Uses RJSF v5 extraErrors format: { fieldName: { __errors: ['message'] } }
  validateFormData: (formData: any): IValidationResult => {
    const result: IValidationResult = {};
    const url = formData.codapSourceDocumentUrl || '';

    // Warn if URL doesn't look like a CODAP URL
    if (url && !isValidUrl(url)) {
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

  // Compute derived display values for form data (generatedUrl, passthroughParamsDisplay)
  computeFormData: (formData: any, authoredState: IAuthoredState) => {
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
      generatedUrl: authoredState.wrappedInteractiveUrl || '',
      advancedOptions: {
        ...formData.advancedOptions,
        passthroughParamsDisplay
      }
    };
  }
};
```

**`authoring-configs/index.ts`:**
```typescript
import { IAuthoringConfig } from "../components/types";
import { codapAuthoringConfig } from "./codap-config";
import { genericAuthoringConfig } from "./generic-config";

// Registry of authoring configurations keyed by type name.
// app.tsx normalizes the authoring param (trim + lowercase) before lookup.
// Unknown types (including "true", "1", etc.) trigger a console warning
// and fall back to the generic config via getAuthoringConfig() returning null.
export const authoringConfigs: { [key: string]: IAuthoringConfig } = {
  codap: codapAuthoringConfig,
  generic: genericAuthoringConfig,
  // Future configs can be added here:
  // sage: sageAuthoringConfig,
  // netlogo: netlogoAuthoringConfig,
};

export const getAuthoringConfig = (type: string): IAuthoringConfig | null => {
  return authoringConfigs[type] || null;
};
```

**`authoring-configs/generic-config.ts`:**
```typescript
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
        default: true,
        description: "Enable fullscreen scaling and fullscreen button (uncheck to disable)"
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
      "ui:widget": "checkbox"
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
```

### 5. Create Authoring Component (`authoring.tsx`)

Create a new component `packages/full-screen/src/components/authoring.tsx`:

```typescript
import React, { useMemo, useState, useCallback, useRef } from "react";
import Form from "@rjsf/core";
import { ErrorSchema, FieldErrorProps } from "@rjsf/utils";
import validator from "@rjsf/validator-ajv8";
import { IAuthoredState, IValidationResult } from "./types";
import { getAuthoringConfig } from "../authoring-configs";
import { customWidgets } from "@concord-consortium/question-interactives-helpers/src/components/custom-widgets";

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
 * 1. Custom fields in extraErrors are still accessible via idSchema
 * 2. The FieldErrorTemplate still receives the full error schema
 * If this breaks, alternatives include:
 * - Using React Context to pass severity info separately
 * - Storing severity in a separate state map keyed by field path
 * - Encoding severity in the error message itself (e.g., "[WARNING] message")
 *
 * Tested with: @rjsf/core ^5.9.0
 *
 * TODO: If RJSF v6+ breaks __severity passthrough, fall back to encoding
 * severity in the message prefix (e.g., "[WARNING] message"). The
 * IValidationMessage interface in types.ts provides the abstraction layer -
 * only convertToExtraErrors() and this template need to change.
 */
const FieldErrorTemplate: React.FC<FieldErrorProps> = ({ errors, idSchema }) => {
  if (!errors || errors.length === 0) {
    return null;
  }

  // Access the raw error schema to get our custom __severity field
  // WARNING: This relies on RJSF passing through custom fields in extraErrors.
  // See IMPORTANT note above regarding RJSF version compatibility.
  const errorSchema = (idSchema as any)?.__errors;
  const severity = (idSchema as any)?.__severity || 'error';

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

interface IProps {
  authoredState: IAuthoredState;
  onAuthoredStateChange: (state: IAuthoredState) => void;
  authoringType: string;
  originalWrappedUrl?: string;  // Original URL from query param (for reset)
}

export const Authoring: React.FC<IProps> = ({
  authoredState,
  onAuthoredStateChange,
  authoringType,
  originalWrappedUrl
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

  // Ref for the form container (used for focus management after reset)
  const formContainerRef = useRef<HTMLDivElement>(null);

  // Reset form to default values (recovery option for corrupted state)
  // If originalWrappedUrl is provided, reset restores the source URL to that value
  // rather than clearing it entirely - this preserves the original document reference.
  const handleReset = useCallback(() => {
    if (window.confirm('Reset all settings to defaults? This cannot be undone.')) {
      // Clear any error states
      setParseError(null);
      setBuildError(null);

      // Start with initial data from config
      let resetData = { ...(config?.initialData || {}) };

      // If we have an original URL, restore it to the source URL field
      // This ensures reset goes back to the original document, not a blank form
      if (originalWrappedUrl && config?.sourceUrlField) {
        resetData = {
          ...resetData,
          [config.sourceUrlField]: originalWrappedUrl
        };

        // Parse the original URL to populate form fields with its settings
        if (config.parseUrlToFormData) {
          try {
            const parsedData = config.parseUrlToFormData(originalWrappedUrl);
            resetData = parsedData;
          } catch {
            // If parsing fails, keep resetData with just the original URL
          }
        }
      }

      const wrappedInteractiveUrl = config?.buildUrl
        ? config.buildUrl(resetData)
        : resetData.wrappedInteractiveUrl;

      onAuthoredStateChange({
        ...authoredState,
        wrappedInteractiveUrl: wrappedInteractiveUrl || undefined,
        disableFullscreen: config?.getDisableFullscreen
          ? config.getDisableFullscreen(resetData)
          : !resetData.enableFullscreen,
        authoringConfig: {
          type: authoringType,
          version: config?.dataVersion || 1,
          data: resetData
        }
      });

      // Reset focus to first form field for accessibility
      // Use setTimeout to ensure state update has rendered
      setTimeout(() => {
        const firstInput = formContainerRef.current?.querySelector<HTMLElement>(
          'input, textarea, select, [tabindex]:not([tabindex="-1"])'
        );
        firstInput?.focus();
      }, 0);
    }
  }, [config, authoringType, authoredState, onAuthoredStateChange, originalWrappedUrl]);

  if (!config) {
    return (
      <div className={css.error}>
        Unknown authoring type: {authoringType}
      </div>
    );
  }

  // Compute uiSchema dynamically to handle disabled states and conditional visibility
  // Each config can provide its own computeUiSchema function for type-specific logic
  const computedUiSchema = useMemo(() => {
    if (!config.computeUiSchema) {
      return config.uiSchema;
    }

    const currentData = authoredState.authoringConfig?.data || config.initialData || {};
    return config.computeUiSchema(currentData, config.uiSchema);
  }, [config, authoredState.authoringConfig?.data]);

  // Get current form data from one of three sources (in priority order):
  // 1. Existing authoringConfig.data (previously saved form state, migrated if needed)
  // 2. Parsed from wrappedInteractiveUrl (editing existing interactive without authoringConfig)
  // 3. config.initialData (brand new interactive)
  const formData = useMemo(() => {
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

  const handleChange = ({ formData: newFormData }: any) => {
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
  };

  // Compute validation messages from config's validateFormData function
  // Also includes any parse errors from failed URL parsing
  // These are displayed as non-blocking warnings/errors below fields
  const extraErrors = useMemo(() => {
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

  // Combine class names for highlight effect
  const formClassName = highlightOptions
    ? `${css.formContainer} ${css.highlightOptions}`
    : css.formContainer;

  return (
    <div className={css.authoring}>
      <div className={css.header}>
        <h2>Configure {config.type.toUpperCase()} Interactive</h2>
        <button
          type="button"
          onClick={handleReset}
          className={css.resetButton}
          title="Reset all settings to defaults"
        >
          Reset to Defaults
        </button>
      </div>

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

      <div className={formClassName} ref={formContainerRef}>
        <Form
          schema={config.schema}
          uiSchema={computedUiSchema}
          formData={formData}
          validator={validator}
          onChange={handleChange}
          widgets={customWidgets}
          templates={{ FieldErrorTemplate }}  // Custom template for warning severity
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
```

### 6. Update App Component (`app.tsx`)

Transform the App component to support both runtime and authoring modes:

```typescript
import React from "react";
import queryString from "query-string";
import { Runtime } from "./runtime";
import { Authoring } from "./authoring";
import { IAuthoredState } from "./types";
import { detectInteractiveType } from "../utils/detect-interactive-type";
import { getAuthoringConfig } from "../authoring-configs";
import {
  useAuthoredState,
  useInitMessage
} from "@concord-consortium/lara-interactive-api";

export const App = () => {
  const initMessage = useInitMessage();
  const params = queryString.parse(location.search);
  const wrappedInteractive = Array.isArray(params.wrappedInteractive)
    ? params.wrappedInteractive[0]
    : params.wrappedInteractive;

  // Get authoring param (used to select which config, not to determine authoring mode)
  const authoringParam = Array.isArray(params.authoring)
    ? params.authoring[0]
    : params.authoring;

  // Determine which authoring config to use:
  // 1. authoring=<type> → use specified config (explicit override)
  // 2. Wrapped URL detected as known type → use detected config (auto-detect)
  // 3. Everything else → use generic config (fallback)
  // This approach supports future types (sage, netlogo, etc.) without code changes.
  const detectedType = wrappedInteractive ? detectInteractiveType(wrappedInteractive) : null;
  const authoringType = typeof authoringParam === "string"
    ? authoringParam.trim().toLowerCase()  // Normalize: trim whitespace and lowercase
    : detectedType ?? "generic";

  // Warn if explicit authoring param doesn't match a known config
  // (will fall back to generic, but author may have made a typo)
  if (authoringParam && !getAuthoringConfig(authoringType)) {
    console.warn(
      `Unknown authoring type "${authoringParam}" - falling back to generic config. ` +
      `Known types: codap, generic`
    );
  }

  // Dev mode logging for authoring type resolution (helps debug auto-detection)
  if (process.env.NODE_ENV === 'development') {
    console.debug('[Full Screen Authoring]', {
      authoringParam,
      detectedType,
      resolvedType: authoringType,
      source: authoringParam ? 'explicit' : (detectedType ? 'auto-detected' : 'fallback')
    });
  }

  // LARA determines authoring vs runtime mode via initMessage
  const isAuthoringMode = initMessage?.mode === "authoring";

  // Use LARA hooks for authored state persistence
  // Note: Runtime uses its own hooks directly, so we only need authoredState here for Authoring
  const { authoredState, setAuthoredState } = useAuthoredState<IAuthoredState>();

  // Initialize default authored state if not set
  const currentAuthoredState: IAuthoredState = authoredState || {
    version: 1,
    wrappedInteractiveUrl: wrappedInteractive || undefined,
    questionType: "iframe_interactive"
  };

  if (!wrappedInteractive && !currentAuthoredState.wrappedInteractiveUrl) {
    return <div>Error: No wrapped interactive URL provided. Use ?wrappedInteractive=&lt;url&gt;</div>;
  }

  if (isAuthoringMode) {
    return (
      <Authoring
        authoredState={currentAuthoredState}
        onAuthoredStateChange={setAuthoredState}
        authoringType={authoringType || "generic"}
        originalWrappedUrl={wrappedInteractive}
      />
    );
  }

  // Runtime uses LARA hooks directly for state (useAuthoredState, useInteractiveState)
  // so we don't need to pass props - it gets state from the shared hook context
  return <Runtime />;
};
```

### 7. Create Shared Utility Functions (`utils/`)

Note: CODAP-specific code is organized into three files for maintainability:
- `codap-url-utils.ts` - URL parsing and building functions
- `codap-schema.ts` - Form schema, uiSchema, and initial data
- `codap-config.ts` - Assembles the configuration and contains validation helpers

Only shared utilities used across multiple configs belong in `utils/`.

**`utils/detect-interactive-type.ts`:**
```typescript
/**
 * Detects the type of interactive from its URL.
 * Returns the interactive type identifier or null if not recognized.
 *
 * NOTE: This function only detects production CODAP domains (codap.concord.org,
 * codap3.concord.org). Local development URLs (localhost, ngrok, etc.) are NOT
 * auto-detected. For local CODAP instances, use the `?authoring=codap` URL
 * parameter to explicitly select the CODAP authoring form.
 *
 * @param url - The URL to analyze
 * @returns The interactive type ('codap', etc.) or null if not recognized
 */
export const detectInteractiveType = (url: string): string | null => {
  const normalizedUrl = url.toLowerCase();

  // CODAP detection (supports both CODAP 2 and CODAP 3)
  // Note: Only production domains are auto-detected. For local development
  // (localhost, ngrok, etc.), use ?authoring=codap to force CODAP form.
  if (normalizedUrl.includes('codap.concord.org') ||
      normalizedUrl.includes('codap3.concord.org')) {
    return 'codap';
  }

  // Future detections can be added here:
  // if (normalizedUrl.includes('sagemodeler')) return 'sage';
  // if (normalizedUrl.includes('netlogo')) return 'netlogo';

  return null;
};
```

### 8. Update Runtime Component (`runtime.tsx`)

Modify the Runtime component to accept and use the authored configuration:

```typescript
// Add to imports
import React, { useCallback, useEffect } from "react";
import queryString from "query-string";
import screenfull from "screenfull";
import { IAuthoredState, IInteractiveState } from "./types";
import {
  useAuthoredState,
  useInteractiveState,
  useInitMessage,
  useAccessibility,
  setSupportedFeatures,
  setHint
} from "@concord-consortium/lara-interactive-api";
import { IframeRuntime } from "@concord-consortium/question-interactives-helpers/src/components/iframe-runtime";
import { FullScreenButton } from "./full-screen-button";
import { useForceUpdate } from "../hooks/use-force-update";

// NOTE: Runtime does NOT recalculate the URL - it uses the pre-calculated
// wrappedInteractiveUrl from authoredState (set during authoring)

export const Runtime: React.FC = () => {
  const forceUpdate = useForceUpdate();
  const initMessage = useInitMessage();
  const { authoredState } = useAuthoredState<IAuthoredState>();

  // Check if fullscreen mode is disabled.
  // NOTE: disableFullscreen is a negative boolean - undefined/false means fullscreen IS enabled.
  // This ensures backward compatibility: interactives without authored state default to fullscreen.
  const fullscreenDisabled = authoredState?.disableFullscreen === true;

  const toggleFullScreen = useCallback(() => {
    // Guard: screenfull.isEnabled is false when fullscreen API is unavailable
    // (e.g., iframe without allow="fullscreen", or unsupported browser)
    if (screenfull?.isEnabled) {
      screenfull.toggle();
    }
  }, []);

  const accessibility = useAccessibility();

  useEffect(() => {
    const onChange = () => forceUpdate();
    screenfull?.on("change", onChange);
    window.addEventListener('resize', onChange);
    return () => {
      screenfull?.off("change", onChange);
      window.removeEventListener('resize', onChange);
    };
  }, [forceUpdate]);

  useEffect(() => {
    const aspectRatio = screen.width / screen.height;
    setSupportedFeatures({
      interactiveState: true,
      aspectRatio
    });
  }, [initMessage]);

  const { interactiveState, setInteractiveState } = useInteractiveState<IInteractiveState>();
  const isFullScreen = screenfull?.isFullscreen;

  // ... existing getIframeTransforms function ...

  const setScaling = () => {
    let scaledIframeWidth: number | string, scaledIframeHeight: number | string, scaledIframeTransformOrigin: string, scaledIframeTransform: string;
    if (!isFullScreen) {
      const trans = getIframeTransforms(window, screen);
      scaledIframeWidth = trans.unscaledWidth;
      scaledIframeHeight = trans.unscaledHeight;
      scaledIframeTransformOrigin = "top left";
      scaledIframeTransform = "scale3d(" + trans.scale + "," + trans.scale + ",1)";
    } else {
      // Disable scaling in fullscreen mode.
      scaledIframeWidth = "100%";
      scaledIframeHeight = "100%";
      scaledIframeTransformOrigin = "";
      scaledIframeTransform = "scale3d(1,1,1)";
    }

    return {
      width: scaledIframeWidth,
      height: scaledIframeHeight,
      transformOrigin: scaledIframeTransformOrigin,
      transform: scaledIframeTransform,
      display: "inline",
      position: "fixed",
      top: 0,
      right: 0,
      bottom: 0,
      left: 0,
    };
  };

  const setNotScaling = () => {
    return {
      width: "100%",
      height: "100%",
      display: "inline",
      position: "fixed",
      top: 0,
      right: 0,
      bottom: 0,
      left: 0,
    };
  };

  // Use pre-calculated URL from authored state, or fall back to query param
  // The URL is calculated during authoring and stored - no recalculation here
  const wrappedInteractive = queryString.parse(location.search)?.wrappedInteractive;
  const queryUrl = Array.isArray(wrappedInteractive) ? wrappedInteractive[0] : wrappedInteractive;
  const url = authoredState?.wrappedInteractiveUrl || queryUrl;

  if (!url) {
    return <div>No sub items available. Please add them using the authoring interface.</div>;
  }

  // Use setNotScaling() when fullscreen is disabled, otherwise use setScaling()
  const iframeStyle = fullscreenDisabled ? setNotScaling() : setScaling();

  return (
    <>
      <IframeRuntime url={url}
                     iframeStyling={iframeStyle}
                     interactiveState={interactiveState}
                     setInteractiveState={setInteractiveState}
                     setHint={setHint}
                     initMessage={initMessage}
                     report={initMessage?.mode === "report"}
                     flushOnSave={true}
                     accessibility={accessibility}
      />
      {screenfull && !fullscreenDisabled &&
        <FullScreenButton isFullScreen={screenfull.isFullscreen} handleToggleFullScreen={toggleFullScreen} />}
    </>
  );
};
```

### 9. Add SCSS Styling (`authoring.scss` and `runtime.scss`)

Create styling file for the authoring interface:

**`authoring.scss`:**
```scss
.authoring {
  padding: 20px;
  max-width: 800px;
  margin: 0 auto;

  .header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 20px;
    padding-bottom: 15px;
    border-bottom: 1px solid #ddd;

    h2 {
      margin: 0;
      color: #333;
    }

    .info {
      font-size: 14px;
      color: #666;

      code {
        background: #f5f5f5;
        padding: 2px 6px;
        border-radius: 3px;
        font-size: 12px;
      }
    }
  }

  .resetButton {
    padding: 6px 12px;
    font-size: 13px;
    color: #666;
    background: #f5f5f5;
    border: 1px solid #ddd;
    border-radius: 4px;
    cursor: pointer;
    transition: all 0.2s ease;

    &:hover {
      background: #eee;
      border-color: #ccc;
      color: #333;
    }

    &:active {
      background: #ddd;
    }
  }

  .formContainer {
    // Target checkbox fields (CODAP options) for highlight animation
    // RJSF renders checkboxes in .field-boolean elements
    .field-boolean {
      transition: background-color 0.3s ease-out;
      border-radius: 4px;
      padding: 2px 4px;
      margin: -2px -4px;
    }
  }

  // Highlight animation when source URL changes and checkboxes update
  .highlightOptions {
    .field-boolean {
      animation: optionsHighlight 0.6s ease-out;
    }
  }

  .error {
    padding: 15px;
    background: #fee;
    border: 1px solid #fcc;
    border-radius: 4px;
    color: #c33;
  }

  // Dismissible error banner for URL build failures
  .errorBanner {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 15px;
    margin-bottom: 15px;
    background: #fef3cd;
    border: 1px solid #ffc107;
    border-radius: 4px;
    color: #856404;

    .dismissButton {
      background: none;
      border: none;
      font-size: 20px;
      line-height: 1;
      color: #856404;
      cursor: pointer;
      padding: 0 4px;
      margin-left: 10px;

      &:hover {
        color: #533f03;
      }
    }
  }

  // Validation message styling (RJSF renders errors in .text-danger or .error-detail)
  // We use extraErrors with custom __severity for warnings vs errors
  .formContainer {
    // Default error styling (red)
    .text-danger,
    .error-detail {
      color: #dc3545;
      font-size: 13px;
      margin-top: 4px;
    }

    // Warning styling (orange/amber) - applied via data attribute or class
    // Note: RJSF doesn't natively support warning severity, so we style based on message content
    // or use a custom ErrorList template. For simplicity, we'll use a softer error style.
    .field-error {
      // Subtle left border to indicate validation issue
      border-left: 3px solid #dc3545;
      padding-left: 8px;
      margin-left: -11px;

      // Warning variant (can be toggled via custom template or data attribute)
      &.warning {
        border-left-color: #f59e0b;

        .text-danger,
        .error-detail {
          color: #b45309;
        }
      }
    }
  }

  // Custom FieldErrorTemplate styling for warnings vs errors
  .fieldErrors {
    list-style: none;
    padding: 0;
    margin: 4px 0 0 0;
    font-size: 13px;

    li {
      padding: 2px 0;
    }
  }

  .errorMessage {
    color: #dc3545;  // Bootstrap danger red
    border-left: 3px solid #dc3545;
    padding-left: 8px;
    margin-left: 0;
  }

  .warningMessage {
    color: #b45309;  // Amber/orange for warnings
    border-left: 3px solid #f59e0b;
    padding-left: 8px;
    margin-left: 0;
  }
}

// Keyframe animation for the highlight pulse
@keyframes optionsHighlight {
  0% {
    background-color: transparent;
  }
  30% {
    background-color: rgba(59, 130, 246, 0.15); // Light blue highlight
  }
  100% {
    background-color: transparent;
  }
}

// Respect user's reduced motion preference for accessibility
@media (prefers-reduced-motion: reduce) {
  .highlightOptions {
    .field-boolean {
      animation: none;
      // Use a static subtle background instead of animation
      background-color: rgba(59, 130, 246, 0.1);
      transition: background-color 0.5s ease-out 0.5s; // Fade out after delay
    }
  }
}
```

**Update `runtime.scss` to support both modes:**
```scss
// Simple wrapper mode (when fullscreen is disabled)
.simpleWrapper {
  width: 100%;
  height: 100%;

  .iframe {
    width: 100%;
    height: 100%;
    border: none;
  }
}

// Fullscreen mode (existing styles)
.fullscreenWrapper {
  // ... existing fullscreen styles ...
  position: relative;
  width: 100%;
  height: 100%;

  .scaledContent {
    // ... existing scaling/transform styles ...
  }

  .iframe {
    width: 100%;
    height: 100%;
    border: none;
  }
}
```

## UI Wireframes

### CODAP Authoring Interface (`?authoring=codap`)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  Configure CODAP Interactive                          [Reset to Defaults]   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  CODAP Source Document URL                                                  │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │ https://codap.concord.org/app/static/dg/en/cert/index.html#shared=  │    │
│  │ https%3A%2F%2Fcfm-shared.concord.org%2F...                          │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│  Paste a CODAP shared link, full-screen wrapped URL, or interactiveApi URL  │
│                                                                             │
│  ─────────────────────────────────────────────────────────────────────────  │
│                                                                             │
│  CODAP Options                                                              │
│                                                                             │
│  ☑ Display fullscreen button                                                │
│    Allows users to open CODAP in fullscreen by clicking fullscreen button   │
│                                                                             │
│  ☑ Display data visibility toggles on graphs (app=is)                       │
│    Allows users to use toggles on graphs to control which data is visible   │
│                                                                             │
│  ☑ Display all components always & prevent scrolling (inbounds=true)        │
│    Keeps components displayed inside the browser window, even when          │
│    displayed in smaller browser windows (users will not see horizontal      │
│    or vertical scroll bars on the browser window when browser is resized)   │
│                                                                             │
│  ☐ Remove toolbars & background grid (embeddedMode=yes)                     │
│    Removes toolbars and background grid; all components remain moveable     │
│                                                                             │
│  ☐ Lock components (componentMode=yes)                                      │
│    Locks position of components and prevents the user from moving them      │
│    around the canvas (also removes toolbars)                                │
│                                                                             │
│  ─────────────────────────────────────────────────────────────────────────  │
│                                                                             │
│  ▶ Advanced CODAP Options                              [collapsed by default]
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Advanced CODAP Options (Expanded)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  ▼ Advanced CODAP Options                                                   │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │                                                                       │  │
│  │  ☐ di                                                                 │  │
│  │    Requires a string specifying the URL of a plugin to load           │  │
│  │    Plugin URL ┌─────────────────────────────────────────────────┐     │  │
│  │               │                                          [disabled]   │  │
│  │               └─────────────────────────────────────────────────┘     │  │
│  │                                                                       │  │
│  │  ☐ di-override                                                        │  │
│  │    Requires a string value that is a substring of the current DI      │  │
│  │    to be replaced, used in conjunction with di parameter              │  │
│  │    value      ┌─────────────────────────────────────────────────┐     │  │
│  │               │                                          [disabled]   │  │
│  │               └─────────────────────────────────────────────────┘     │  │
│  │                                                                       │  │
│  │  ☐ guideIndex                                                         │  │
│  │    Requires an integer which specifies the number of guide page       │  │
│  │    to show on load; default is 0 (first page)                         │  │
│  │    value      ┌─────────────────────────────────────────────────┐     │  │
│  │               │ 0                                        [disabled]   │  │
│  │               └─────────────────────────────────────────────────┘     │  │
│  │                                                                       │  │
│  │  ☐ Custom URL parameters                                              │  │
│  │    Enter additional CODAP URL parameters in the form of a string      │  │
│  │    that is appended to the end of the URL                             │  │
│  │    ┌─────────────────────────────────────────────────────────────┐    │  │
│  │    │ key1=value1&key2=value2                              [disabled]  │  │
│  │    │ or one per line:                                                 │  │
│  │    │ foo=bar                                                          │  │
│  │    └─────────────────────────────────────────────────────────────┘    │  │
│  │                                                                       │  │
│  │  Passthrough Parameters           [only shown if passthrough exists]  │  │
│  │    ┌─────────────────────────────────────────────────────────────┐    │  │
│  │    │ standalone = true                                  [read-only]   │  │
│  │    │ lang = en                                                        │  │
│  │    └─────────────────────────────────────────────────────────────┘    │  │
│  │    These parameters from the source URL will be included in the       │  │
│  │    generated URL (not controlled by form options above)               │  │
│  │                                                                       │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  Generated URL                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │ https://codap3.concord.org/?interactiveApi&documentId=https%3A%2F%  │    │
│  │ 2Fcfm-shared.concord.org%2FkQt77dsG4A1NLyTBqpLN%2Ffile.json&app=is  │    │
│  │ &inbounds=true                                            [read-only]    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│  The final URL that will be used for this CODAP interactive (read-only)     │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Generic Fallback Authoring Interface (non-CODAP URL)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  Configure GENERIC Interactive                        [Reset to Defaults]   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Wrapped Interactive URL                                                    │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │ https://some-interactive.com/app?param1=value1&param2=value2        │    │
│  │                                                                     │    │
│  │                                                                     │    │
│  │                                                                     │    │
│  │                                                                     │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│  Full URL of the interactive to wrap (including any query parameters)       │
│                                                                             │
│  ☑ Enable Fullscreen Mode                                                   │
│    Enable fullscreen scaling and fullscreen button (uncheck to disable)     │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Notes:**
- The CODAP form is rendered within the LARA authoring dialog's "Authoring" tab
- Checkbox input fields (Plugin URL, value, etc.) are disabled until their parent checkbox is checked
- The "Passthrough Parameters" field only appears when the source URL contains parameters not controlled by the form
- Generated URL updates in real-time as form values change
- The generic fallback provides a minimal interface for any non-CODAP interactive
- The "Reset to Defaults" button restores form fields to their initial values (with confirmation). If an original `wrappedInteractive` URL was provided via query param, reset restores the source URL to that original value rather than clearing it entirely.

## Example Use Cases

### Use Case 1: CODAP URL (Auto-Detected)
```
?wrappedInteractive=https://codap.concord.org/app/static/dg/en/cert/index.html
```
When the wrapped URL is detected as a CODAP URL, the CODAP authoring form is automatically displayed. No `?authoring` parameter is needed.

Author workflow:
1. **Paste source URL** into "CODAP Source Document URL" field. Accepts any of these formats:
   - Shared link from CODAP: `https://codap3.concord.org/#shared=https%3A%2F%2Fcfm-shared...`
   - InteractiveApi link: `https://codap3.concord.org/?interactiveApi&documentId=https%3A%2F%2Fcfm-shared...`
   - Existing full-screen wrapped link: `https://models-resources.concord.org/question-interactives/full-screen/?wrappedInteractive=...`

2. **Configure CODAP Options** via checkboxes:
   - Display fullscreen button (default: checked)
   - Display data visibility toggles on graphs (app=is) (default: unchecked)
   - Display all components always & prevent scrolling (default: unchecked)
   - Remove toolbars & background grid (default: unchecked)
   - Lock components (default: unchecked)

3. **Optionally expand Advanced CODAP Options** to configure:
   - Plugin URL (di parameter)
   - di-override value
   - Guide index
   - Custom URL parameters

4. **View Generated URL** at the bottom of the advanced section showing the final URL

The runtime will:
1. Use the pre-calculated `wrappedInteractiveUrl` from authored state
2. Check `disableFullscreen` flag (from negated "Display fullscreen button" checkbox)
3. If fullscreen enabled: render with scaling, transforms, and fullscreen button
4. If fullscreen disabled: render simple iframe wrapper without fullscreen features

Example Generated URL:
```
https://codap3.concord.org/?interactiveApi&documentId=https%3A%2F%2Fcfm-shared.concord.org%2FkQt77dsG4A1NLyTBqpLN%2Ffile.json&inbounds=true
```

### Use Case 2: Non-CODAP URL (Generic Form)
```
?wrappedInteractive=https://some-interactive.com
```
For non-CODAP URLs, authors get a simple generic form with:
- Large text input field for editing the full wrapped interactive URL
- Enable fullscreen mode checkbox (default checked - controls scaling and fullscreen button)
- Can edit URL directly including any query parameters
- Useful for interactives without specific configuration schemas

The runtime will:
1. Use the URL from the textarea (if edited in authoring mode)
2. Otherwise fall back to the query parameter
3. No additional URL parameter processing (URL is used as-is)

### Use Case 3: Force CODAP Form (Override)
```
?wrappedInteractive=https://example.com&authoring=codap
```
Use `?authoring=codap` to force the CODAP authoring form even for non-CODAP URLs. This is useful if you want to use the CODAP form's URL building features with a non-standard CODAP URL that isn't auto-detected.

### Use Case 4: Future Interactive Type
```
?wrappedInteractive=https://sagemodeler.concord.org&authoring=sage
```
After adding sage-config.ts with SageModeler-specific detection patterns, Sage URLs would be auto-detected similar to CODAP URLs. The `?authoring=sage` override would force the Sage form for non-Sage URLs.

## Implementation Steps

These steps correspond to the Proposed Changes sections above and should be implemented in this order:

1. **Update types.ts** *(Proposed Change 3)*
   - Add `IAuthoringConfig` interface
   - Add `ICodapAdvancedOptions` and `ICodapAuthoringData` interfaces
   - Add `IGenericAuthoringData` interface
   - Update `IAuthoredState` to include `wrappedInteractiveUrl`, `disableFullscreen`, and `authoringConfig`
   - Ensure `IInteractiveState` is complete

2. **Create authoring-configs directory structure** *(Proposed Change 4)*
   - Create `packages/full-screen/src/authoring-configs/` directory
   - Add `codap-url-utils.ts` with URL parsing and building functions (parseCodapUrl, buildCodapUrl, etc.)
   - Add `codap-schema.ts` with form schema, uiSchema, and initialData
   - Add `codap-config.ts` that imports from the above files and assembles the authoring configuration
   - Add `generic-config.ts` with fallback text input schema
   - Add `index.ts` with config registry and `getAuthoringConfig()` function

3. **Create shared utility functions** *(Proposed Changes 2 and 7)*
   - Create `packages/full-screen/src/utils/` directory
   - Add `detect-interactive-type.ts` with pattern matching logic for URL detection (used by app.tsx for auto-detection)

4. **Create authoring.tsx component** *(Proposed Change 5)*
   - Implement form rendering using React JSON Schema Form
   - Handle state changes via `onChange` callback
   - Calculate and display generated URL using `buildCodapUrl()`
   - Save final URL to `authoredState.wrappedInteractiveUrl`
   - Use customWidgets from helpers package

5. **Create authoring.scss** *(Proposed Change 9)*
   - Add styling for authoring interface
   - Style form sections and headers
   - Add error state styling

6. **Update app.tsx** *(Proposed Changes 1 and 6)*
   - Parse `authoring` query string parameter
   - Use `detectInteractiveType()` for auto-detection of CODAP URLs
   - Conditionally render Authoring or Runtime component
   - Use LARA hooks (`useAuthoredState`, `useInteractiveState`) for state persistence

7. **Update runtime.tsx** *(Proposed Change 8)*
   - Use pre-calculated URL from `authoredState.wrappedInteractiveUrl`
   - Fall back to query parameter if no authored state
   - Check `authoredState.disableFullscreen` flag
   - When fullscreen enabled: maintain existing fullscreen scaling logic and UI
   - When fullscreen disabled: render simple iframe wrapper without FullScreenButton or scaling

8. **Update runtime.scss** *(Proposed Change 9)*
   - Add simple wrapper styles for disabled fullscreen mode
   - Maintain existing fullscreen wrapper styles

9. **Testing**
   - Test runtime mode (LARA initMessage.mode = "runtime")
   - Test authoring mode with CODAP URL → CODAP form displayed (auto-detect)
   - Test authoring mode with non-CODAP URL → generic form displayed
   - Test authoring mode with `?authoring=codap` + non-CODAP URL → CODAP form displayed (override)
   - Test URL parsing for all 6 CODAP URL formats (shared hash, interactiveApi, wrapped)
   - Test passthrough params are preserved
   - Test custom params override passthrough params
   - Verify form state persistence via LARA hooks
   - Test fullscreen enabled (default): verify scaling, fullscreen button, transforms
   - Test fullscreen disabled: verify simple iframe wrapper, no button, no scaling
   - **RJSF Upgrade Regression Test** (known fragile integration):
     - Verify warning vs error styling still works after any RJSF upgrade
     - Check that `__severity` field is still accessible in `FieldErrorTemplate`
     - If broken, activate fallback: prefix messages with "Warning:" or "Error:"

10. **Documentation**
    - Document the `?authoring=codap` override parameter and auto-detection behavior
    - Provide examples for adding new interactive types
    - Document CODAP configuration options and URL formats

## Benefits

1. **Extensible Architecture** - Easy to add authoring support for new interactive types (SageModeler, NetLogo, etc.)
2. **Lightweight Approach** - Doesn't require LARA integration or library interactive infrastructure
3. **Backward Compatible** - Existing runtime-only usage continues to work unchanged
4. **Inline Configuration** - Authors can configure wrapped interactives without leaving the page
5. **Type-Specific Options** - Each interactive type can have its own custom configuration schema
6. **Automatic Detection** - Pattern matching can enable authoring automatically for recognized URLs
7. **URL-Based Workflow** - Maintains the existing simple URL-based workflow as default
8. **Consistent UI** - Uses the same React JSON Schema Form infrastructure as other interactives

## Backward Compatibility

The implementation maintains full backward compatibility:
- Runtime mode continues to work with just `?wrappedInteractive=<url>`
- No authoring interface appears unless triggered by `?authoring=<type>` or pattern match
- Existing Full Screen interactives are unaffected
- Authors can opt-in to authoring mode when needed

## Related Approaches

This implementation differs from other container interactives in the repository:
- **Carousel, Side-by-Side, Scaffolded Question** - Use library interactive dropdowns and BaseQuestionApp
- **Full Screen (this spec)** - Uses URL-based workflow with optional inline authoring triggered by parameter or pattern

The approach is unique because:
- Primary workflow remains URL-based (simple and flexible)
- Authoring is opt-in rather than required
- No dependency on library interactive infrastructure
- Can work with any URL, with enhanced authoring for specific types
- Uses React JSON Schema Form directly rather than through BaseQuestionApp

## Future Enhancements

### Additional Interactive Types
1. **SageModeler** - Add sage-config.ts with SageModeler-specific options
2. **NetLogo Web** - Add netlogo-config.ts for NetLogo configuration
3. **Other Interactives** - Easy to extend with new config files

### Enhanced CODAP Configuration
1. **Additional URL Parameters** - Add more CODAP URL parameters as checkboxes/selects (e.g., `standalone`, `embeddedMode`, `hideUndoRedo`)
2. **Document Configuration** - Enhanced document URL input with validation and preview
3. **Language and Localization** - Extended language options and regional settings
4. **Dimension Settings** - Width/height parameters if CODAP supports them
5. **Feature Toggles** - More checkboxes for CODAP feature flags as URL parameters
6. **Plugin URLs** - Text fields for CODAP plugin URLs to be added as parameters
7. **Dataset URLs** - Additional URL fields for pre-loading datasets via parameters

### Pattern Matching Improvements
1. **Version Detection** - Detect and handle different CODAP versions
2. **Subdomain Support** - Handle custom CODAP subdomains
3. **Query Param Preservation** - Maintain existing query params in wrapped URL

### Authoring UI Enhancements
1. **Preview Mode** - Live preview of wrapped interactive with current config
2. **Configuration Templates** - Pre-built templates for common scenarios
3. **Import/Export** - Save and share authoring configurations
4. **Validation** - Advanced validation for URLs and configuration data
5. **Help Text** - Contextual help for each configuration option

### Integration Features
1. **State Synchronization** - Sync authored config with wrapped interactive state
2. **Communication Protocol** - Enhanced iframe messaging for config updates
3. **Runtime Config Updates** - Allow runtime modification of configuration
4. **Conditional Options** - Show/hide options based on other selections

## Dependencies

- `@rjsf/core` - React JSON Schema Form core
- `@rjsf/validator-ajv8` - JSON Schema validator
- `@rjsf/utils` - RJSF utility types
- `@concord-consortium/question-interactives-helpers` - Custom widgets, utilities
- `@concord-consortium/lara-interactive-api` - Interactive API hooks
- `query-string` - URL parameter parsing (already in use)

## Technical Decisions

### Why Not Use BaseQuestionApp?
- BaseQuestionApp is designed for LARA-integrated interactives with library interactive dropdown
- Full Screen needs to maintain its URL-based workflow
- Direct RJSF usage provides more control over when/how authoring appears
- Simpler to implement opt-in authoring

### How Authoring Mode is Determined
- **LARA controls authoring vs runtime mode** via `initMessage.mode`
- The `?authoring` URL parameter only selects which authoring *form* is displayed
- This aligns with how LARA manages other interactives

### Why URL Parameter for Config Override?
- Authors can specify `?authoring=codap` to force CODAP form even for non-CODAP URLs
- Without the parameter, auto-detection based on URL patterns determines the form
- This provides a simple default (auto-detect) with an explicit override when needed

### Why Pattern Matching?
- Provides better user experience - auto-selects the right config based on wrapped URL
- Extensible - easy to add patterns for new interactive types
- Zero configuration required for common case (CODAP URLs get CODAP form automatically)

### How wrappedInteractiveUrl and URL Parameters Work
React JSON Schema Form's `onChange` handler provides the complete form data on every change. The approach:

1. **Form includes source URL field** - Textarea for pasting CODAP shared link or document URL
2. **Form includes parameter control fields** - Checkboxes for CODAP options (fullscreen, visibility toggles, inbounds, etc.)
3. **onChange calculates final URL** - `buildCodapUrl()` parses source URL and applies all form options
4. **Final URL saved to authored state** - Calculated URL stored in `authoredState.wrappedInteractiveUrl`
5. **Generated URL displayed in form** - Read-only field shows the calculated URL for author verification
6. **All form data saved in config** - Complete form data maintained in `authoringConfig.data` for form state
7. **Runtime uses stored URL directly** - No recalculation; just uses `authoredState.wrappedInteractiveUrl`

**URL Construction Flow (Authoring Only):**
- **Author pastes URL** → `parseCodapUrl()` extracts base URL, documentId, passthrough params
- **Author configures options** → Form checkboxes control URL parameters
- **On each change** → `buildCodapUrl()` constructs final URL from all inputs
- **Final URL stored** → Saved to `authoredState.wrappedInteractiveUrl`
- **Runtime** → Uses stored URL directly (no recalculation)

**Benefits of this approach:**
- Preview in authoring exactly matches runtime behavior
- No redundant URL calculation on every runtime load
- Simpler, faster runtime code
- URL is "baked in" at authoring time

**Alternative approaches considered:**
- **URL string manipulation in form**: Could construct full URL in form, but harder to maintain and validate
- **Dependencies in schema**: JSON Schema `dependencies` could show/hide fields but doesn't construct URLs
- **Custom widget**: Could create a custom URL builder widget, but standard controls are simpler and more maintainable
- **Separate URL field outside form**: Could separate URL from form entirely, but including it provides better UX and consistency

### Configuration Storage
- Authored config is stored in the Full Screen interactive's state
- The wrappedInteractiveUrl can be saved in authored state (nullable)
- The disableFullscreen flag controls whether fullscreen mode is active (default: false/enabled)
- At runtime, saved wrappedInteractiveUrl takes precedence over query parameter
- Config is applied at runtime by modifying the wrapped interactive's URL
- This approach works with any wrapped interactive that accepts URL parameters
- No need for the wrapped interactive to understand Full Screen's authoring

### Fullscreen Behavior Control
- **Checkbox in form**: "Enable Fullscreen Mode" (default: checked)
- **Stored as**: `disableFullscreen` (negated - checked=false, unchecked=true)
- **When enabled** (disableFullscreen=false or undefined): Full scaling, fullscreen button, transform applied
- **When disabled** (disableFullscreen=true): Simple iframe wrapper, no scaling, no fullscreen UI
- **Use case for disabled**: When interactive should maintain original size or has its own fullscreen controls

**Why `disableFullscreen` instead of `fullscreenEnabled`?**
The negative naming is intentional for backward compatibility. When `disableFullscreen` is `undefined` (no authored state exists, e.g., runtime-only mode with just `?wrappedInteractive=`), fullscreen is enabled by default. If we used `fullscreenEnabled`, then `undefined` would mean fullscreen is disabled, breaking existing interactives that rely on the current fullscreen behavior. The negative boolean ensures the default (undefined) case preserves the expected fullscreen experience.

### URL Precedence
- **Runtime**: Authored state URL > Query parameter URL
- **Authoring**: Query parameter provides initial URL for form
- **Benefits**: Authors can change the wrapped URL without updating query parameters everywhere

### Authored State Versioning
The `IAuthoredState` interface includes a `version: 1` field for future migration support.

**When to increment the version:**
- Renaming or removing fields from `IAuthoredState` (breaking change)
- Changing the meaning/interpretation of existing fields
- Restructuring nested objects like `authoringConfig.data`

**When NOT to increment the version:**
- Adding new optional fields (backward compatible)
- Adding new values to union types
- Changes to runtime behavior that don't affect stored state

**Migration strategy (when needed):**
```typescript
const migrateAuthoredState = (state: any): IAuthoredState => {
  if (!state.version || state.version === 1) {
    // Handle v1 or unversioned state
    return state as IAuthoredState;
  }
  // Future: add migration logic for v2, v3, etc.
  return state;
};
```

**Current state:** Version 1 is the initial schema. No migrations are needed yet.

### Config-Specific Data Versioning
In addition to the top-level `IAuthoredState.version`, each authoring config has its own `dataVersion` for migrating config-specific data independently.

**Structure:**
```typescript
authoringConfig: {
  type: 'codap',
  version: 2,  // Version when this data was saved
  data: { ... }
}
```

**How it works:**
1. Each config defines `dataVersion` (defaults to 1 if not specified)
2. When saving, `authoringConfig.version` is set to `config.dataVersion`
3. When loading, if `authoringConfig.version < config.dataVersion`, `migrateData()` is called
4. Migration errors are logged but don't block - unmigrated data is used as fallback

**When to increment config's dataVersion:**
- Renaming fields in the config's form data (e.g., `url` → `sourceUrl`)
- Removing fields that were previously required
- Changing the shape of nested objects

**Example migration:**
```typescript
const codapConfig: IAuthoringConfig<ICodapAuthoringData> = {
  type: 'codap',
  dataVersion: 2,  // Current version
  // ...
  migrateData: (data, fromVersion) => {
    let migrated = { ...data };
    if (fromVersion < 2) {
      // v1 -> v2: renamed 'url' to 'codapSourceDocumentUrl'
      migrated.codapSourceDocumentUrl = data.url;
      delete migrated.url;
    }
    return migrated as ICodapAuthoringData;
  }
};
```

**Benefits:**
- CODAP config can evolve independently of generic config
- Old interactives are migrated automatically on first edit
- Top-level version only needs to change for structural changes to `IAuthoredState` itself

### Form Validation
Non-intrusive validation provides feedback without blocking the author's workflow:

**Validation types:**
- **Errors**: Issues that will likely cause problems (e.g., invalid URL format)
- **Warnings**: Hints about potential issues (e.g., URL doesn't look like a CODAP link)

**Implementation approach:**
- Config provides `validateFormData(formData) => IValidationResult`
- Results are converted to RJSF's `extraErrors` format for inline display
- `showErrorList={false}` hides the error summary, showing only inline messages
- Custom `__severity` field distinguishes warnings from errors for styling

**What gets validated:**
- URL fields: checks for valid URL format, warns if URL doesn't match expected patterns
- Custom params: checks for valid key=value format

**Styling:**
- Errors: red text and left border
- Warnings: amber/orange text and left border (softer than errors)

**Implementation:** RJSF doesn't natively support warning severity, so we use a custom `FieldErrorTemplate` component that:
- Reads our custom `__severity` field from the error schema
- Applies appropriate CSS classes (`css.warningMessage` vs `css.errorMessage`)
- Sets `role="alert"` only for errors (not warnings) for proper screen reader behavior
- Renders errors in a styled `<ul>` list below each field

This approach is more robust than CSS heuristics alone because it explicitly reads our severity metadata and applies the correct styling programmatically.

### Config Callback Error Handling
Config callbacks like `parseUrlToFormData` and `buildUrl` may throw exceptions (e.g., malformed URLs, unexpected input). The authoring component handles these gracefully to prevent UI crashes:

**URL parsing errors (`parseUrlToFormData`):**
- Displayed as field-level validation error on the source URL field
- Error message extracted from exception and shown inline below the field
- Form continues to function with the raw (unparsed) URL value
- Author can correct the URL and try again

**URL building errors (`buildUrl`):**
- Displayed in a dismissible warning banner above the form
- Previous valid URL is preserved in authored state (doesn't overwrite with broken value)
- Author can dismiss the banner and continue editing
- Banner uses amber/warning styling to distinguish from blocking errors

**Rationale for hybrid approach:**
- Parse errors relate directly to the source URL field the user just edited, so inline display makes sense
- Build errors may be caused by any combination of form fields, so a banner provides better visibility
- Neither error type blocks the form from functioning - authors can always continue editing

### Source URL Change Visual Feedback
When an author pastes a new URL into the CODAP Source Document URL field, the form checkboxes automatically update to reflect that URL's settings. To prevent author confusion when multiple fields change at once:
- **Visual highlight**: A brief blue pulse animation highlights all checkbox fields when they update from URL parsing
- **Animation duration**: 600ms - long enough to notice but not disruptive
- **Implementation**: CSS animation triggered by React state, auto-clears after animation completes
- **Rationale**: Authors might not notice checkbox changes if they're focused on the URL field; the highlight draws attention to the updated settings so they can review and customize if needed
- **Accessibility**: Respects `prefers-reduced-motion` media query - users with motion sensitivity see a static subtle background highlight instead of animation, which fades out after a short delay

### Accessibility

The authoring interface must be accessible to users with disabilities, following WCAG 2.1 AA guidelines.

**Keyboard Navigation:**
- All form controls must be reachable and operable via keyboard alone
- Tab order should follow logical visual order (top to bottom, left to right)
- The "Reset to Defaults" button must be keyboard accessible
- Collapsible sections (Advanced Options) must be expandable/collapsible via Enter or Space
- Focus should remain visible at all times (no `outline: none` without alternative)

**Screen Reader Support:**
- Form fields must have associated labels (RJSF handles this via schema `title` properties)
- Validation errors must be announced to screen readers
  - Use `aria-describedby` to associate error messages with fields
  - Use `aria-invalid="true"` on fields with errors
  - Consider `role="alert"` or `aria-live="polite"` for dynamically appearing errors
- The error banner should use `role="alert"` for immediate announcement
- Group related fields with `fieldset` and `legend` where appropriate

**Color and Contrast:**
- Error messages (red) must meet 4.5:1 contrast ratio against background
- Warning messages (amber) must meet 4.5:1 contrast ratio against background
- Don't rely solely on color to convey information (icons or text labels supplement color)
- Interactive elements must have visible focus indicators with sufficient contrast

**Motion and Animation:**
- Respect `prefers-reduced-motion` media query (already implemented for highlight animation)
- Animations should not flash more than 3 times per second
- Provide static alternatives for users who disable motion

**Focus Management:**
- After dismissing error banner, return focus to a logical location (the form or triggering field)
- After reset confirmation, focus should move to the first form field
- When validation errors appear, consider moving focus to the first error field

**Implementation Notes:**
- RJSF provides baseline accessibility for standard form controls
- Custom widgets from helpers package should maintain accessibility standards
- The error banner includes `aria-label` on the dismiss button
- Test with screen readers (NVDA, VoiceOver) and keyboard-only navigation

## Acceptance Criteria

### URL Parsing & Generation
- [ ] CODAP Source Document URL field accepts all supported URL formats:
  - [ ] CODAP3 shared hash: `https://codap3.concord.org/#shared=<encoded-url>`
  - [ ] CODAP3 interactiveApi: `https://codap3.concord.org/?interactiveApi&documentId=<encoded-url>`
  - [ ] CODAP2 shared hash: `https://codap.concord.org/app/static/dg/en/cert/index.html#shared=<encoded-url>`
  - [ ] CODAP2 interactiveApi: `https://codap.concord.org/...?interactiveApi&documentId=<encoded-url>`
  - [ ] Full-screen wrapped URLs are unwrapped and parsed correctly
  - [ ] Local development URLs work with `authoring=codap` parameter

**URL Parsing Test Matrix:**

| Input URL | Detected Format | Extracted baseUrl | Extracted documentId |
|-----------|-----------------|-------------------|----------------------|
| `https://codap3.concord.org/#shared=https%3A%2F%2Fcfm...` | shared-hash | `https://codap3.concord.org/` | `https://cfm...` (decoded) |
| `https://codap.concord.org/app/...#shared=https%3A...` | shared-hash | `https://codap.concord.org/app/...` | decoded URL |
| `https://codap3.concord.org/?interactiveApi&documentId=https%3A...` | interactive-api | `https://codap3.concord.org/` | decoded URL |
| `https://codap.concord.org/?url=https%3A...` | interactive-api | `https://codap.concord.org/` | decoded URL |
| `https://full-screen.../index.html?wrappedInteractive=...codap...` | full-screen-wrapped | (unwrapped inner URL) | (from inner URL) |
| `https://codap.concord.org/` (no doc ID) | unknown | `https://codap.concord.org/` | null |
| `not-a-valid-url` | unknown | `not-a-valid-url` | null |
| (empty string) | unknown | `` | null |
| URL with both `#shared=` AND `?documentId=` | shared-hash | base URL | shared= value (takes precedence) |
| URL with multiple `?documentId=` params | interactive-api | base URL | first value only |

- [ ] Generated URL is calculated and displayed in real-time as form options change
- [ ] Generated URL includes `interactiveApi` parameter for LARA integration
- [ ] Generated URL includes `documentId` parameter extracted from source URL
- [ ] Query parameters not controlled by the form are passed through to the generated URL
  - [ ] Allows testing new CODAP parameters without adding form controls
  - [ ] Custom params field overrides passthrough params (custom params have highest priority)
  - [ ] Priority order: custom params > passthrough params > form checkbox params

### CODAP Options
- [ ] "Display fullscreen button" checkbox (default: checked) controls fullscreen mode
- [ ] "Display data visibility toggles on graphs (app=is)" checkbox (default: unchecked) adds `app=is` when checked
- [ ] "Display all components always & prevent scrolling" checkbox (default: unchecked) adds `inbounds=true` when checked
- [ ] "Remove toolbars & background grid" checkbox (default: unchecked) adds `embeddedMode=yes`
- [ ] "Lock components" checkbox (default: unchecked) adds `componentMode=yes`

### Advanced CODAP Options
- [ ] Advanced options section is collapsed by default
- [ ] "di" checkbox enables Plugin URL field, adds `di=<url>` parameter
- [ ] "di-override" checkbox enables value field, adds `di-override=<value>` parameter
- [ ] "guideIndex" checkbox enables value field, adds `guideIndex=<number>` parameter
- [ ] "Custom URL parameters" checkbox enables textarea, appends custom params to URL
- [ ] Generated URL field is read-only and displays the final calculated URL

### Authoring Mode
- [ ] LARA determines authoring vs runtime mode (via initMessage.mode)
- [ ] CODAP URLs auto-detect and display CODAP authoring form
- [ ] Non-CODAP URLs display generic authoring form
- [ ] `?authoring=codap` forces CODAP form even for non-CODAP URLs (override)
- [ ] Editing existing interactives without authoringConfig: form fields are populated by parsing the existing URL
  - [ ] `parseCodapUrlToFormData()` extracts checkbox values from URL parameters
  - [ ] Author can modify existing settings without losing current configuration
- [ ] When author changes the CODAP Source Document URL field, checkboxes auto-update to reflect the new URL's parameters
  - [ ] Allows pasting a URL and seeing its current settings reflected in the form
  - [ ] Author can then modify checkboxes to customize the final URL
  - [ ] Visual highlight animation on checkbox fields provides feedback that settings were updated from URL

### Validation Feedback
- [ ] Invalid URL format shows error message below URL field
- [ ] Non-CODAP URLs show warning (not error) indicating CODAP options may not apply
- [ ] Invalid custom params format shows warning with specific guidance
- [ ] Validation messages appear inline below fields (not in a separate error list)
- [ ] Validation does not block form submission or state saving
- [ ] Error styling uses red color; warning styling uses amber/orange

### RJSF Upgrade Regression (Known Fragile Integration)
- [ ] After any `@rjsf/core` upgrade, verify warning vs error styling still works
- [ ] Specifically test: `__severity` field accessible in custom `FieldErrorTemplate`
- [ ] If `__severity` passthrough breaks in future RJSF versions:
  - [ ] Activate fallback: prefix messages with "Warning:" or "Error:" in `convertToExtraErrors()`
  - [ ] Update `FieldErrorTemplate` to parse severity from message prefix
  - [ ] Document the change in CHANGELOG

### Config Callback Error Handling
- [ ] If `parseUrlToFormData` throws, error appears as field-level validation on source URL field
- [ ] Parse errors don't crash the UI - form continues to function
- [ ] If `buildUrl` throws, error appears in dismissible banner above the form
- [ ] Build errors preserve the previous valid URL in authored state
- [ ] Error banner can be dismissed by clicking the × button
- [ ] After correcting the issue, subsequent changes clear the error state

### Reset Functionality
- [ ] "Reset to Defaults" button is visible in the header
- [ ] Clicking reset shows a confirmation dialog
- [ ] Confirming reset clears all form fields to their default values
- [ ] Reset also clears any error states (parse errors, build errors)
- [ ] Canceling the confirmation dialog does not reset the form
- [ ] After reset, the generated URL reflects the default values
- [ ] After reset, focus moves to the first form field (accessibility)
- [ ] When originalWrappedUrl is provided (from query param):
  - [ ] Reset restores source URL field to originalWrappedUrl (not empty)
  - [ ] Reset parses the original URL to populate form options from it
  - [ ] If original URL parsing fails, source URL is still restored (graceful degradation)
- [ ] When no originalWrappedUrl is provided:
  - [ ] Reset clears source URL to empty string (standard behavior)

### Runtime Behavior
- [ ] Runtime uses pre-stored `authoredState.wrappedInteractiveUrl` directly (no URL recalculation)
- [ ] Falls back to query param `?wrappedInteractive=` if no authored state
- [ ] When disableFullscreen is false (default), fullscreen button and scaling are active
- [ ] When disableFullscreen is true, runtime renders simple iframe without fullscreen UI
- [ ] LARA controls runtime vs authoring mode (authoring param only affects config selection)

### General
- [ ] Form changes are saved to authoredState via LARA `useAuthoredState` hook
- [ ] Architecture supports adding new interactive types easily
- [ ] Form uses custom widgets from helpers package
- [ ] Configuration is properly typed with TypeScript
- [ ] Error states are handled gracefully (unknown authoring type, missing URL)
- [ ] SCSS styling matches the design patterns of other interactives

### Accessibility
- [ ] All form controls are reachable and operable via keyboard alone
- [ ] Tab order follows logical visual order
- [ ] Screen reader announces field labels and descriptions correctly
- [ ] Validation errors are announced to screen readers (aria-invalid, aria-describedby)
- [ ] Error banner uses role="alert" for immediate announcement
- [ ] Focus is visible on all interactive elements
- [ ] Color contrast meets WCAG AA (4.5:1 for text)
- [ ] Animations respect prefers-reduced-motion media query
- [ ] Reset button is keyboard accessible with clear focus indicator
