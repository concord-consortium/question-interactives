import { IAuthoredState, IAuthoredStateV1 } from "./types";

export const migrateAuthoredState = (authoredState: IAuthoredStateV1 | IAuthoredState) => {
  if (authoredState.version === 1) {
    // Converts http://question-interactives.concord.org/version/0.5.0/open-response to open-response
    const urlToIntName = (url: string) => {
      while (url[url.length - 1] === "/") {
        url = url.slice(0, -1);
      }
      return url.substr(url.lastIndexOf("/") + 1);
    };
    const newState: IAuthoredState = {
      ...authoredState,
      version: 2,
      subinteractive: {
        id: authoredState.subinteractive?.id || "",
        authoredState: authoredState.subinteractive?.authoredState,
        // wrappedInteractive: authoredState.subinteractive && urlToIntName(authoredState.subinteractive.url) || ""
        subInteractiveUrl: authoredState.subinteractive?.subInteractiveUrl || ""
      }
    };
    return newState;
  }
  return authoredState;
};
