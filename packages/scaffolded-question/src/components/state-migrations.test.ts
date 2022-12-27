import { migrateAuthoredState } from "./state-migrations";
import { IAuthoredState, IAuthoredStateV1 } from "./types";
import deepmerge from "deepmerge";

describe("authored state migration", () => {
  it("leave the current version unaffected", () => {
    const state: IAuthoredState = {
      version: 2,
      questionType: "iframe_interactive",
      subinteractives: [
        {
          id: "uuid",
          libraryInteractiveId: "open-response",
          authoredState: {}
        }
      ]
    };
    const stateCopy = deepmerge({}, state);
    expect(migrateAuthoredState(state)).toEqual(stateCopy);
  });

  it("should convert V1 to V2", () => {
    const stateV1: IAuthoredStateV1 = {
      version: 1,
      questionType: "iframe_interactive",
      subinteractives: [
        {
          id: "uuid",
          url: "https://question-interactives.concord.org/version/0.5.0/open-response",
          authoredState: {}
        },
        {
          id: "uuid",
          url: "https://question-interactives.concord.org/version/0.5.0/multiple-choice",
          authoredState: {}
        }
      ]
    };
    const stateV2: IAuthoredState = {
      version: 2,
      questionType: "iframe_interactive",
      subinteractives: [
        {
          id: "uuid",
          libraryInteractiveId: "open-response",
          authoredState: {}
        },
        {
          id: "uuid",
          libraryInteractiveId: "multiple-choice",
          authoredState: {}
        }
      ]
    };
    expect(migrateAuthoredState(stateV1)).toEqual(stateV2);
  });
});
