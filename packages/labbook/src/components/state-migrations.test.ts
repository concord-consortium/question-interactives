import { migrateAuthoredState } from "./state-migrations";
import { IAuthoredState, IAuthoredStateV1 } from "./types";
import deepmerge from "deepmerge";

describe("authored state migration", () => {
  it("leave the current version unaffected", () => {
    const state: IAuthoredState = {
      version: 2,
      questionType: "iframe_interactive",
      maxItems: 10,
      showItems: 3,
      showUploadImageButton: false,
    };
    const stateCopy = deepmerge({}, state);
    expect(migrateAuthoredState(state)).toEqual(stateCopy);
  });

  it("should convert hideAnnotationTool when true", () => {
    const stateV1: IAuthoredStateV1 = {
      version: 1,
      questionType: "iframe_interactive",
      maxItems: 10,
      showItems: 3,
      showUploadImageButton: false,
      hideAnnotationTool: true,
    };
    const stateV2: IAuthoredState = {
      version: 2,
      questionType: "iframe_interactive",
      maxItems: 10,
      showItems: 3,
      showUploadImageButton: false,
      hideDrawingTools: ["annotation"],
    };
    expect(migrateAuthoredState(stateV1)).toEqual(stateV2);
  });

  it("should convert hideAnnotationTool when false", () => {
    const stateV1: IAuthoredStateV1 = {
      version: 1,
      questionType: "iframe_interactive",
      maxItems: 10,
      showItems: 3,
      showUploadImageButton: false,
      hideAnnotationTool: false,
    };
    const stateV2: IAuthoredState = {
      version: 2,
      questionType: "iframe_interactive",
      maxItems: 10,
      showItems: 3,
      showUploadImageButton: false
    };
    expect(migrateAuthoredState(stateV1)).toEqual(stateV2);
  });
});
