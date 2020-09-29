import { renderHook } from "@testing-library/react-hooks";
import { useLinkedInteractives } from "./use-linked-interactives";

let initMessage: any;
let authoredState: any;
const setAuthoredState = jest.fn();

jest.mock("@concord-consortium/lara-interactive-api", () => ({
  useInitMessage: jest.fn(() => initMessage),
  useAuthoredState: jest.fn(() => ({
    authoredState,
    setAuthoredState
  }))
}));

describe("useLinkedInteractives", () => {
  beforeEach(() => {
    initMessage = {};
    authoredState = {};
    setAuthoredState.mockClear();
  });

  it("removes linked interactive IDs from authored state if linkedInteractives array is empty or undefined", () => {
    initMessage = {
      mode: "authoring"
    };
    authoredState = {
      linkedInteractive1: "ID 1",
      linkedInteractive2: "ID 2"
    };
    const HookWrapper = () => {
      return useLinkedInteractives([ "linkedInteractive1", "linkedInteractive2" ]);
    };
    renderHook(HookWrapper);
    expect(setAuthoredState).toHaveBeenCalledTimes(2);
    const updatedState1 = setAuthoredState.mock.calls[0][0](authoredState);
    const updatedState2 = setAuthoredState.mock.calls[1][0](updatedState1);
    expect(updatedState1).toEqual({ linkedInteractive1: undefined, linkedInteractive2: "ID 2" });
    expect(updatedState2).toEqual({ linkedInteractive1: undefined, linkedInteractive2: undefined });
  });

  it("overwrites linked interactive IDs in authored state if linkedInteractives array is defined - 1", () => {
    initMessage = {
      mode: "authoring",
      linkedInteractives: [
        { id: "new ID 1", label: "linkedInteractive1" },
      ]
    };
    authoredState = {
      linkedInteractive1: "ID 1",
      linkedInteractive2: "ID 2"
    };
    const HookWrapper = () => {
      return useLinkedInteractives([ "linkedInteractive1", "linkedInteractive2" ]);
    };
    renderHook(HookWrapper);
    expect(setAuthoredState).toHaveBeenCalledTimes(2);
    const updatedState1 = setAuthoredState.mock.calls[0][0](authoredState);
    const updatedState2 = setAuthoredState.mock.calls[1][0](updatedState1);
    expect(updatedState1).toEqual({ linkedInteractive1: "new ID 1", linkedInteractive2: "ID 2" });
    expect(updatedState2).toEqual({ linkedInteractive1: "new ID 1", linkedInteractive2: undefined });
  });

  it("overwrites linked interactive IDs in authored state if linkedInteractives array is defined - 2", () => {
    initMessage = {
      mode: "authoring",
      linkedInteractives: [
        { id: "new ID 1", label: "linkedInteractive1" },
        { id: "new ID 2", label: "linkedInteractive2" },
        { id: "new ID 3", label: "linkedInteractive3" },
      ]
    };
    authoredState = {
      linkedInteractive1: "ID 1",
      linkedInteractive2: "ID 2"
    };
    const HookWrapper = () => {
      return useLinkedInteractives([ "linkedInteractive1", "linkedInteractive2" ]);
    };
    renderHook(HookWrapper);
    expect(setAuthoredState).toHaveBeenCalledTimes(2);
    const updatedState1 = setAuthoredState.mock.calls[0][0](authoredState);
    const updatedState2 = setAuthoredState.mock.calls[1][0](updatedState1);
    expect(updatedState1).toEqual({ linkedInteractive1: "new ID 1", linkedInteractive2: "ID 2" });
    expect(updatedState2).toEqual({ linkedInteractive1: "new ID 1", linkedInteractive2: "new ID 2" });
  });

  it("do nothing if the mode is not authoring or runtime", () => {
    initMessage = {
      mode: "report",
      linkedInteractives: [
        { id: "new ID 1", label: "linkedInteractive1" },
        { id: "new ID 2", label: "linkedInteractive2" },
        { id: "new ID 3", label: "linkedInteractive3" },
      ]
    };
    authoredState = {
      linkedInteractive1: "ID 1",
      linkedInteractive2: "ID 2"
    };
    const HookWrapper = () => {
      return useLinkedInteractives([ "linkedInteractive1", "linkedInteractive2" ]);
    };
    renderHook(HookWrapper);
    expect(setAuthoredState).not.toHaveBeenCalled();
  });

  it("does nothing if linkedInteractives array is matching authored state", () => {
    initMessage = {
      mode: "authoring",
      linkedInteractives: [
        { id: "ID 1", label: "linkedInteractive1" }
      ]
    };
    authoredState = {
      linkedInteractive1: "ID 1"
    };
    const HookWrapper = () => {
      return useLinkedInteractives([ "linkedInteractive1", "linkedInteractive2" ]);
    };
    renderHook(HookWrapper);
    expect(setAuthoredState).not.toHaveBeenCalled();
  });
});
