import { IAuthoredState, IAuthoredStateV1 } from "./types";

export const migrateAuthoredState = (authoredState: IAuthoredStateV1 | IAuthoredState) => {

  if (authoredState.version === 1) {
    // add hide annotation setting to drawing tools to hide
    const {hideAnnotationTool} = authoredState;
    delete (authoredState as any).hideAnnotationTool;
    const newState: IAuthoredState = {...authoredState, version: 2};
    if (hideAnnotationTool) {
      newState.hideDrawingTools = newState.hideDrawingTools ?? [];
      if (newState.hideDrawingTools.indexOf("annotation") === -1) {
        newState.hideDrawingTools.push("annotation");
      }
    }
    return newState;
  }

  return authoredState;
};
