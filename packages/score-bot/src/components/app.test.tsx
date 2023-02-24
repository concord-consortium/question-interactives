import React from "react";
import { act, render } from "@testing-library/react";
import { useAuthoredState, useInitMessage, useInteractiveState
        } from "@concord-consortium/lara-interactive-api";
import { App } from "./app";
import { IAuthoredState, IInteractiveState } from "./types";

jest.unmock("react-jsonschema-form");

jest.mock("@concord-consortium/lara-interactive-api", () => ({
  useInitMessage: jest.fn(),
  useAuthoredState: jest.fn(),
  useInteractiveState: jest.fn(),
  setSupportedFeatures: jest.fn(),
  getFirebaseJwt: jest.fn().mockReturnValue({token: "test"}),
  getClient: jest.fn().mockReturnValue({
    addListener: jest.fn()
  }),
}));

const useInitMessageMock = useInitMessage as jest.Mock;
const useAuthoredStateMock = useAuthoredState as jest.Mock;
const useInteractiveStateMock = useInteractiveState as jest.Mock;

const authoredState = {
  version: 1,
  questionType: "iframe_interactive",
  prompt: "Test prompt",
  hint: "hint",
  required: true,
  defaultAnswer: "",
  scoreBotItemId: "foo",
  scoreMapping: ["0", "1", "2", "3", "4"]
} as IAuthoredState;

const interactiveState = {
  answerType: "interactive_state",
  answerText: "Test answer",
} as IInteractiveState;

describe("ScoreBOT question", () => {
  beforeEach(() => {
    // JSDOM doesn't support selection yet, but Slate handles a null return
    // cf. https://github.com/jsdom/jsdom/issues/317#ref-commit-30bedcf
    window.getSelection = () => null;
  });

  useInitMessageMock.mockReturnValue({
    version: 1,
    mode: "authoring",
    authoredState
  });
  useAuthoredStateMock.mockReturnValue(authoredState);
  useInteractiveStateMock.mockReturnValue(interactiveState);

  it("renders a rich text editor in authoring mode", async () => {
    const { container } = render(<App />);
    expect(container).toBeDefined();
    await act(async () => {
      const promptEditor = await container.querySelector("#root_prompt");
      expect(promptEditor?.className.includes("slate-editor")).toBe(true);
    });
  });
});
