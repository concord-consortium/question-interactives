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
