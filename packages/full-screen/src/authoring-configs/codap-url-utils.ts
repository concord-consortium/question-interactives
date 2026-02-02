import { ICodapAuthoringData } from "../components/types";

/**
 * Parsed CODAP URL information
 */
export interface IParsedCodapUrl {
  baseUrl: string;
  documentId: string | null;
  passthroughParams: Record<string, string>;
  formatType: 'shared-hash' | 'interactive-api' | 'full-screen-wrapped' | 'iframe-embed' | 'unknown';
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
 * Parses an iframe embed string and extracts the src URL (recursive helper)
 */
const parseIframeEmbed = (input: string): IParsedCodapUrl => {
  try {
    // Extract src attribute from iframe tag using regex
    const srcMatch = input.match(/src=["']([^"']+)["']/i);
    if (!srcMatch || !srcMatch[1]) {
      return { baseUrl: '', documentId: null, passthroughParams: {}, formatType: 'iframe-embed' };
    }
    const srcUrl = srcMatch[1];
    const parsed = parseCodapUrl(srcUrl);
    return { ...parsed, formatType: 'iframe-embed' };
  } catch (e) {
    return { baseUrl: '', documentId: null, passthroughParams: {}, formatType: 'iframe-embed' };
  }
};

/**
 * Parses various CODAP URL formats and extracts the base URL and document ID.
 * Supports: shared hash, interactiveApi, full-screen wrapped, iframe embed, and legacy formats.
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
 * 1. Iframe embed (extract src URL, recursive parse)
 * 2. Full-screen wrapped URL (recursive unwrap)
 * 3. Hash fragment with shared= (CODAP shared links)
 * 4. Query param documentId= (interactiveApi format)
 * 5. Query param url= (legacy format)
 * 6. Unknown format (base URL only)
 */
export const parseCodapUrl = (inputUrl: string): IParsedCodapUrl => {
  if (!inputUrl) {
    return { baseUrl: '', documentId: null, passthroughParams: {}, formatType: 'unknown' };
  }

  try {
    // Check for iframe embed (from CODAP Share dialog "Embed" tab)
    if (inputUrl.trim().startsWith('<iframe') && inputUrl.includes('src=')) {
      return parseIframeEmbed(inputUrl);
    }

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

  const paramsString = customParamsValue.trim()
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
  return entries.map(([key, value]) => `${key}=${value}`).join('\n');
};

/**
 * Builds a CODAP URL with parameters from authoring config.
 */
export const buildCodapUrl = (data: ICodapAuthoringData): string | null => {
  const sourceUrl = data.codapSourceDocumentUrl;
  if (!sourceUrl) return null;

  const parsed = parseCodapUrl(sourceUrl);
  if (!parsed.baseUrl) return null;

  try {
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
  } catch (e) {
    // baseUrl was not a valid URL (e.g., malformed input that parseCodapUrl
    // returned as-is). Return null so callers treat it as "no URL available".
    return null;
  }
};

/**
 * Parses an existing CODAP URL and extracts form field values.
 * Used when editing an interactive that has a URL but no saved authoringConfig.
 */
export const parseCodapUrlToFormData = (existingUrl: string): ICodapAuthoringData => {
  try {
    // Normalize inputs so this accepts the same URL formats supported by parseCodapUrl(),
    // including iframe embed strings and full-screen wrapped URLs.
    let urlToParse = existingUrl;

    // Iframe embed (from CODAP Share dialog "Embed" tab)
    if (urlToParse.trim().startsWith('<iframe') && urlToParse.includes('src=')) {
      const srcMatch = urlToParse.match(/src=["']([^"']+)["']/i);
      if (srcMatch?.[1]) {
        urlToParse = srcMatch[1];
      }
    }

    // Full-screen wrapped URL (unwrap)
    if (urlToParse.includes('wrappedInteractive=')) {
      try {
        const outer = new URL(urlToParse);
        const wrappedInteractive = outer.searchParams.get('wrappedInteractive');
        if (wrappedInteractive) {
          urlToParse = decodeURIComponent(wrappedInteractive);
        }
      } catch (e) {
        console.info('full-screen interactive: Could not parse wrapped URL, using original:', e);
      }
    }

    const url = new URL(urlToParse);
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
        guideIndexValue: params.get('guideIndex') ? parseInt(params.get('guideIndex') || '0', 10) : 0,
        enableCustomParams: false,
        customParamsValue: '',
        generatedUrl: ''
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
        enableCustomParams: false, customParamsValue: '',
        generatedUrl: ''
      }
    };
  }
};
