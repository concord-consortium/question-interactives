import React from "react";
import { render } from "@testing-library/react";
import { useAuthoredState, useInitMessage, useInteractiveState
        } from "@concord-consortium/lara-interactive-api";
import { App } from "./app";
import { IAuthoredState, IInteractiveState } from "./types";

jest.unmock("react-jsonschema-form");

jest.mock("@concord-consortium/lara-interactive-api", () => ({
  useInitMessage: jest.fn(),
  useAuthoredState: jest.fn(),
  useInteractiveState: jest.fn(),
  setSupportedFeatures: jest.fn()
}));

const useInitMessageMock = useInitMessage as jest.Mock;
const useAuthoredStateMock = useAuthoredState as jest.Mock;
const useInteractiveStateMock = useInteractiveState as jest.Mock;

const authoredState = {
  version: 1,
  questionType: "open_response",
  prompt: "Test prompt",
  hint: "hint",
  required: false,
  defaultAnswer: ""
} as IAuthoredState;

const interactiveState = {
  answerType: "open_response_answer",
  answerText: "Test answer",
} as IInteractiveState;

describe("Open response question", () => {
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
    const { container, findByLabelText } = render(<App />);
    expect(container).toBeDefined();
    const promptEditor = await findByLabelText("Prompt");
    expect(promptEditor.className.includes("form-control")).toBe(true);
  });
});
