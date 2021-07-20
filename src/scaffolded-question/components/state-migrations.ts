import { IAuthoredState, IAuthoredStateV1 } from "../../shared/types";

export const migrateAuthoredState = (authoredState: IAuthoredStateV1 | IAuthoredState) => {
  if (authoredState.version === 1) {
    // Converts http://question-interactives.concord.org/version/0.5.0/open-response to open-response
    const urlToIntName = (url: string) => {
      while (url[url.length - 1] === "/") {
        url = url.slice(0, -1);
      }
      return url.substr(url.lastIndexOf("/") + 1);
    };
    const newState: IAuthoredState = {...authoredState, version: 2, subinteractives: []};
    newState.subinteractives = authoredState.subinteractives?.map(subint => ({
      id: subint.id,
      authoredState: subint.authoredState,
      libraryInteractiveId: urlToIntName(subint.url)
    }));
    return newState;
  }
  return authoredState;
};
