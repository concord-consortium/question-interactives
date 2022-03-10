import React from "react";
import { act, render } from "@testing-library/react";
import { useAuthoredState, useInitMessage, useInteractiveState } from "@concord-consortium/lara-interactive-api";
import { App } from "./app";
import { IAuthoredState, IInteractiveState } from "./types";

jest.unmock("react-jsonschema-form");

jest.mock("@concord-consortium/lara-interactive-api", () => ({
  useInitMessage: jest.fn(),
  useAuthoredState: jest.fn(),
  useInteractiveState: jest.fn(),
  setSupportedFeatures: jest.fn(),
  getInteractiveList: jest.fn(() => new Promise(() => { /* never resolve */ })),
  getFirebaseJwt: jest.fn().mockReturnValue({token: "test"}),
}));

const useInitMessageMock = useInitMessage as jest.Mock;
const useAuthoredStateMock = useAuthoredState as jest.Mock;
const useInteractiveStateMock = useInteractiveState as jest.Mock;

const authoredState = {
  version: 1,
  questionType: "image_question" as const,
  prompt: "Test prompt",
  hint: "hint",
  required: false,
  defaultAnswer: ""
} as IAuthoredState;

const interactiveState = {
  answerType: "image_question_answer" as const,
  answerText: "Test answer",
} as IInteractiveState;

describe("Image question", () => {
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
  it("renders in authoring mode", async () => {
    const { container } = render(<App />);
    expect(container).toBeDefined();
    await act(async () => {
      const promptEditor = await container.querySelector("#root_prompt");
      expect(promptEditor?.className.includes("slate-editor")).toBe(true);
    });
  });
});
