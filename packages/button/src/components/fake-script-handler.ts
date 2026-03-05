import { IScriptResponse, IFakeScriptResult } from "./types";

const FAKE_DELAY_MS = 2000;

const fakeResponses: Record<string, { queued: IScriptResponse; result: IScriptResponse }> = {
  success: {
    queued: {
      status: "queued",
      message: "",
      disableButton: true,
      processingMessage: "Submitting your work\u2026",
    },
    result: {
      status: "success",
      message: "Great! Your teacher will be notified that you have submitted your work.",
      disableButton: true,
    },
  },
  failure: {
    queued: {
      status: "queued",
      message: "",
      disableButton: true,
      processingMessage: "Checking your answers\u2026",
    },
    result: {
      status: "failure",
      message: "Sorry, you haven't finished answering all the questions. Go back and check your answers. Then return here and click this button again.",
      disableButton: false,
    },
  },
};

const EXAMPLE_URL_PREFIX = "https://example.com/";

export const isFakeScriptUrl = (url: string): boolean => {
  return url.startsWith(EXAMPLE_URL_PREFIX);
};

export const executeFakeScript = (url: string): IFakeScriptResult => {
  const urlObj = new URL(url);
  const action = urlObj.pathname.replace("/", "").split("/")[0];
  const entry = fakeResponses[action];
  if (!entry) {
    const errorResponse: IScriptResponse = {
      status: "failure",
      message: `Unknown fake action: "${action}". Available actions: ${Object.keys(fakeResponses).join(", ")}`,
      disableButton: false,
    };
    return {
      queued: { status: "queued", message: "", disableButton: true },
      result: Promise.resolve(errorResponse),
    };
  }

  // Allow URL query params to override default messages
  const processingMessage = urlObj.searchParams.get("processingMessage");
  const message = urlObj.searchParams.get("message");

  const queued = processingMessage
    ? { ...entry.queued, processingMessage }
    : entry.queued;

  const result = message
    ? { ...entry.result, message }
    : entry.result;

  return {
    queued,
    result: new Promise((resolve) => {
      setTimeout(() => resolve(result), FAKE_DELAY_MS);
    }),
  };
};
