import { renderHook } from "@testing-library/react-hooks";
import { useLinkedInteractivesAuthoring } from "./use-linked-interactives-authoring";
import { act } from "@testing-library/react";
import { getInteractiveList, setLinkedInteractives } from "@concord-consortium/lara-interactive-api";
import { useContextInitMessage } from "./use-context-init-message";

let contextInitMessage: any;
let authoredState: any;
let interactiveList: any;

jest.mock("@concord-consortium/lara-interactive-api", () => ({
  useAuthoredState: jest.fn(() => ({
    authoredState
  })),
  setLinkedInteractives: jest.fn(),
  getInteractiveList: jest.fn(() => new Promise(resolve => setTimeout(() => resolve({ interactives: interactiveList }), 50)))
}));

const getInteractiveListMock = getInteractiveList as jest.Mock;
const setLinkedInteractivesMock = setLinkedInteractives as jest.Mock;

jest.mock("./use-context-init-message", () => ({
  useContextInitMessage: jest.fn(() => contextInitMessage)
}));
const useContextInitMessageMock = useContextInitMessage as jest.Mock;

describe("useLinkedInteractives", () => {
  beforeEach(() => {
    contextInitMessage = {};
    authoredState = {};
    interactiveList = [];
    getInteractiveListMock.mockClear();
    setLinkedInteractivesMock.mockClear();
    useContextInitMessageMock.mockClear();
  });

  it("downloads list of page interactives for properties present in schema and listed in linkedInteractiveProps", async () => {
    contextInitMessage = {
      mode: "authoring"
    };
    interactiveList = [
      { id: "ID1", name: "int 1" },
      { id: "ID2", name: "int 2" },
    ];
    // Property can be in top-level schema, or nested in dependencies.
    const schema = {
      properties: {
        linkedInteractive1: {
          type: "string" as const
        }
      },
      dependencies: {
        linkedInteractive1: {
          properties: {
            linkedInteractive2: {
              type: "string" as const
            }
          }
        }
      }
    };
    const uiSchema = {
      linkedInteractive1: {
        "ui:enumDisabled": []
      }
    }
    const HookWrapper = () => {
      return useLinkedInteractivesAuthoring({
        linkedInteractiveProps: [
          { label: "linkedInteractive1", supportsSnapshots: true },
          { label: "linkedInteractive2" },
          { label: "linkedInteractive3" } // this one is not present in the schema definition above
        ],
        schema,
        uiSchema
      });
    };
    await act(async () => {
      const { result, waitForNextUpdate } = renderHook(HookWrapper);
      await waitForNextUpdate();
      await waitForNextUpdate();
      expect(result.current).toEqual([{
        properties: {
          linkedInteractive1: {
            type: "string",
            enum: [ "ID1", "ID2" ],
            enumNames: [ "ID1 (int 1)", "ID2 (int 2)" ]
          }
        },
        dependencies: {
          linkedInteractive1: {
            properties: {
              linkedInteractive2: {
                type: "string",
                enum: [ "ID1", "ID2" ],
                enumNames: [ "ID1 (int 1)", "ID2 (int 2)" ]
              }
            }
          }
        }
        // Note that linkedInteractive3 wasn't listed in the original schema, so it's not added here either.
      },
      {
        linkedInteractive1: {
          "ui:enumDisabled": []
        }
      }]);
      expect(getInteractiveListMock.mock.calls[0][0]).toEqual({ scope: "page", supportsSnapshots: true });
      expect(getInteractiveListMock.mock.calls[1][0]).toEqual({ scope: "page", supportsSnapshots: undefined });
    });
  });

  it("does not call setLinkedInteractives when it's not necessary (linkedInteractives array and authoredState are matching)", () => {
    contextInitMessage = {
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

  it("monitors authoredState updates and calls setLinkedInteractives when necessary - 1", async () => {
    contextInitMessage = {
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
    const { rerender } = renderHook(HookWrapper);
    expect(setLinkedInteractivesMock).not.toHaveBeenCalled(); // Nothing should happen during initial render!
    rerender();
    expect(setLinkedInteractivesMock).not.toHaveBeenCalled(); // Still nothing, authored state wasn't updated.
    authoredState = {
      linkedInteractive1: "ID2"
    };
    rerender();
    expect(setLinkedInteractivesMock).toHaveBeenCalledWith({
      linkedInteractives: [{id: "ID2", label: "linkedInteractive1"}]
    });
  });

  it("monitors authoredState updates and calls setLinkedInteractives when necessary - 2", () => {
    contextInitMessage = {
      mode: "authoring",
      linkedInteractives: [{id: "ID1", label: "linkedInteractive1"}]
    };
    authoredState = {
      linkedInteractive1: "ID2"
    };
    const HookWrapper = () => {
      return useLinkedInteractivesAuthoring({
        linkedInteractiveProps: [
          { label: "linkedInteractive1" },
        ],
        schema: {}
      });
    };
    const { rerender } = renderHook(HookWrapper);
    expect(setLinkedInteractivesMock).not.toHaveBeenCalled(); // Nothing should happen during initial render!
    rerender();
    expect(setLinkedInteractivesMock).not.toHaveBeenCalled(); // Still nothing, authored state wasn't updated.
    authoredState = {
      linkedInteractive1: undefined
    };
    rerender();
    expect(setLinkedInteractivesMock).toHaveBeenCalledWith({
      linkedInteractives: []
    });
  });

  it("monitors authoredState updates and calls setLinkedInteractives when necessary - 3", () => {
    contextInitMessage = {
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
    const { rerender } = renderHook(HookWrapper);
    expect(setLinkedInteractivesMock).not.toHaveBeenCalled(); // Nothing should happen during initial render!
    rerender();
    expect(setLinkedInteractivesMock).not.toHaveBeenCalled(); // Still nothing, authored state wasn't updated.
    authoredState = {
      linkedInteractive1: "new ID 2"
    };
    rerender();
    expect(setLinkedInteractivesMock).toHaveBeenCalledWith({
      linkedInteractives: [{id: "new ID 2", label: "linkedInteractive1"}]
    });
  });

  it("disables the 'No linked interactives available' option when there are no linked interactives", async () => {
    contextInitMessage = {
      mode: "authoring"
    };
    interactiveList = [];
    const schema = {
      properties: {
        interactive: {
          type: "string" as const
        }
      }
    };
    const uiSchema = {
      interactive: {
        "ui:enumDisabled": []
      },
    }
    const HookWrapper = () => {
      return useLinkedInteractivesAuthoring({
        linkedInteractiveProps: [
          { label: "interactive", supportsSnapshots: true },
        ],
        schema,
        uiSchema
      });
    };
    await act(async () => {
      const { result, waitForNextUpdate } = renderHook(HookWrapper);
      await waitForNextUpdate();
      await waitForNextUpdate();
      expect(result.current).toEqual([{
        properties: {
          interactive: {
            type: "string",
            enum: [ "none" ],
            enumNames: [ "No linked interactives available" ]
          }
        }
      }, {
        interactive: {
          "ui:enumDisabled": ["none"]
        }
      }]);
    });
  });
});
