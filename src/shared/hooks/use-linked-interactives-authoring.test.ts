import { renderHook } from "@testing-library/react-hooks";
import { useLinkedInteractivesAuthoring } from "./use-linked-interactives-authoring";
import { act } from "@testing-library/react";
import {getInteractiveList, setLinkedInteractives} from "@concord-consortium/lara-interactive-api";

let initMessage: any;
let authoredState: any;
let interactiveList: any;

jest.mock("@concord-consortium/lara-interactive-api", () => ({
  useInitMessage: jest.fn(() => initMessage),
  useAuthoredState: jest.fn(() => ({
    authoredState
  })),
  setLinkedInteractives: jest.fn(),
  getInteractiveList: jest.fn(() => new Promise(resolve => setTimeout(() => resolve({ interactives: interactiveList }), 50)))
}));

const getInteractiveListMock = getInteractiveList as jest.Mock;
const setLinkedInteractivesMock = setLinkedInteractives as jest.Mock;

describe("useLinkedInteractives", () => {
  beforeEach(() => {
    initMessage = {};
    authoredState = {};
    interactiveList = [];
    getInteractiveListMock.mockClear();
    setLinkedInteractivesMock.mockClear();
  });

  it("downloads list of page interactives for properties present in schema and listed in linkedInteractiveProps", async () => {
    initMessage = {
      mode: "authoring"
    };
    interactiveList = [
      { id: "ID1", name: "int 1" },
      { id: "ID2", name: "int 2" },
    ];
    const schema = {
      properties: {
        linkedInteractive1: {},
        linkedInteractive2: {}
      }
    };
    const HookWrapper = () => {
      return useLinkedInteractivesAuthoring({
        linkedInteractiveProps: [
          { label: "linkedInteractive1", supportsSnapshots: true },
          { label: "linkedInteractive2" },
          { label: "linkedInteractive3" } // this one is not present in the schema definition above
        ],
        schema
      });
    };
    await act(async () => {
      const { result, waitForNextUpdate } = renderHook(HookWrapper);
      await waitForNextUpdate();
      expect(result.current).toEqual({
        properties: {
          linkedInteractive1: {
            enum: [ "ID1", "ID2" ],
            enumNames: [ "ID1 (int 1)", "ID2 (int 2)" ]
          },
          linkedInteractive2: {
            enum: [ "ID1", "ID2" ],
            enumNames: [ "ID1 (int 1)", "ID2 (int 2)" ]
          }
          // Note that linkedInteractive3 wasn't listed in the original schema, so it's not added here either.
        }
      });
      expect(getInteractiveListMock.mock.calls[0][0]).toEqual({ scope: "page", supportsSnapshots: true });
      expect(getInteractiveListMock.mock.calls[1][0]).toEqual({ scope: "page", supportsSnapshots: undefined });
    });
  });

  it("does not calls setLinkedInteractives when it's not necessary (linkedInteractives array and authoredState are matching)", () => {
    initMessage = {
      mode: "authoring",
      linkedInteractives: [{id: "ID1", label: "linkedInteractive1"}]
    };
    authoredState = {
      linkedInteractive1: "ID1"
    };
    const HookWrapper = () => {
      return useLinkedInteractivesAuthoring({
        linkedInteractiveProps: [
          { label: "linkedInteractive1" },
        ],
        schema: {}
      });
    };
    renderHook(HookWrapper);
    expect(setLinkedInteractivesMock).not.toHaveBeenCalled();
  });

  it("monitors authoredState updates and calls setLinkedInteractives when necessary - 1", () => {
    initMessage = {
      mode: "authoring",
      linkedInteractives: []
    };
    authoredState = {
      linkedInteractive1: "ID1"
    };
    const HookWrapper = () => {
      return useLinkedInteractivesAuthoring({
        linkedInteractiveProps: [
          { label: "linkedInteractive1" },
        ],
        schema: {}
      });
    };
    renderHook(HookWrapper);
    expect(setLinkedInteractivesMock).toHaveBeenCalledWith({
      linkedInteractives: [{id: "ID1", label: "linkedInteractive1"}]
    });
  });

  it("monitors authoredState updates and calls setLinkedInteractives when necessary - 2", () => {
    initMessage = {
      mode: "authoring",
      linkedInteractives: [{id: "ID1", label: "linkedInteractive1"}]
    };
    authoredState = {
      linkedInteractive1: undefined
    };
    const HookWrapper = () => {
      return useLinkedInteractivesAuthoring({
        linkedInteractiveProps: [
          { label: "linkedInteractive1" },
        ],
        schema: {}
      });
    };
    renderHook(HookWrapper);
    expect(setLinkedInteractivesMock).toHaveBeenCalledWith({
      linkedInteractives: []
    });
  });

  it("monitors authoredState updates and calls setLinkedInteractives when necessary - 3", () => {
    initMessage = {
      mode: "authoring",
      linkedInteractives: [{id: "ID1", label: "linkedInteractive1"}]
    };
    authoredState = {
      linkedInteractive1: "new ID"
    };
    const HookWrapper = () => {
      return useLinkedInteractivesAuthoring({
        linkedInteractiveProps: [
          { label: "linkedInteractive1" },
        ],
        schema: {}
      });
    };
    renderHook(HookWrapper);
    expect(setLinkedInteractivesMock).toHaveBeenCalledWith({
      linkedInteractives: [{id: "new ID", label: "linkedInteractive1"}]
    });
  });
});
