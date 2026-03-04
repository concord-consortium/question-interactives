import { IFakeScriptResult } from "./types";
import { isFakeScriptUrl, executeFakeScript } from "./fake-script-handler";

/**
 * Execute a script URL and return the two-phase result (queued + final).
 * Currently only fake script URLs (https://example.com/<action>) are supported.
 * When real script execution is added, this function is the only thing that needs updating.
 */
export const executeScript = (scriptUrl: string): IFakeScriptResult => {
  if (isFakeScriptUrl(scriptUrl)) {
    return executeFakeScript(scriptUrl);
  }

  // Unsupported URL — return immediate failure visible in the UI
  return {
    queued: { status: "queued", message: "", disableButton: true },
    result: Promise.resolve({
      status: "failure",
      message: `Unsupported script URL: "${scriptUrl}". Only https://example.com/<action> URLs are supported right now.`,
      disableButton: false,
    }),
  };
};
