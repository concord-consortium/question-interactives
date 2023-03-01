import React from "react";
import { act, render } from "@testing-library/react";
import { useAuthoredState, useInitMessage, useInteractiveState } from "@concord-consortium/lara-interactive-api";
import { App, isAnswered } from "./app";
import { IAuthoredState, IInteractiveState } from "./types";

jest.unmock("react-jsonschema-form");

jest.mock("@concord-consortium/lara-interactive-api", () => ({
  useInitMessage: jest.fn(),
  useAuthoredState: jest.fn(),
  useInteractiveState: jest.fn(),
  setSupportedFeatures: jest.fn(),
  getInteractiveList: jest.fn(() => new Promise(() => { /* never resolve */ })),
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
  questionType: "image_question" as const,
  prompt: "Test prompt",
  hint: "hint",
  required: false,
  defaultAnswer: ""
} as IAuthoredState;

const interactiveState = {
  answerType: "image_question_answer" as const,
  answerText: "Test answer",
  drawingState: "Drawing Tool state"
} as IInteractiveState;

const interactiveStateWithUserBg = {
  answerType: "image_question_answer" as const,
  answerText: "Test answer",
  userBackgroundImageUrl: "https://user-uploaded-img.com"
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

  describe("isAnswered", () => {
    const authoredStateWithAnswerPrompt: IAuthoredState = {...authoredState, answerPrompt: "This is the answer prompt"};
    const interactiveStateWithAnswerText: IInteractiveState = {...interactiveState, answerText: "This is the answer text"};
    const interactiveStateWithUserBgAndAnswerText: IInteractiveState = {...interactiveStateWithUserBg, answerText: "This is the answer text"};
    const authoredStateWithoutAnswerPrompt: IAuthoredState = {...authoredState, answerPrompt: ""};
    const interactiveStateWithoutAnswerText: IInteractiveState = {...interactiveState, answerText: ""};

    it("returns false when interactive state is null no matter the answer prompt value", () => {
      expect(isAnswered(null)).toBe(false);
      expect(isAnswered(null, authoredStateWithAnswerPrompt)).toBe(false);
      expect(isAnswered(null, authoredStateWithoutAnswerPrompt)).toBe(false);
    });

    it("returns false for questions with answerPrompts without answerText", () => {
      expect(isAnswered(interactiveStateWithoutAnswerText, authoredStateWithAnswerPrompt)).toBe(false);
    });

    it("returns true for questions with answerPrompts and answerText", () => {
      expect(isAnswered(interactiveStateWithAnswerText, authoredStateWithAnswerPrompt)).toBe(true);
    });

    it("returns true for questions with drawing tool state without answerPrompts no matter the answerText value", () => {
      expect(isAnswered(interactiveStateWithAnswerText)).toBe(true);
      expect(isAnswered(interactiveStateWithAnswerText, authoredStateWithoutAnswerPrompt)).toBe(true);
      expect(isAnswered(interactiveStateWithoutAnswerText, authoredStateWithoutAnswerPrompt)).toBe(true);
    });

    it("returns true for questions with drawing tool state without answerPrompts no matter the answerText value", () => {
      expect(isAnswered(interactiveStateWithUserBgAndAnswerText)).toBe(true);
      expect(isAnswered(interactiveStateWithUserBgAndAnswerText, authoredStateWithoutAnswerPrompt)).toBe(true);
      expect(isAnswered(interactiveStateWithUserBgAndAnswerText, authoredStateWithoutAnswerPrompt)).toBe(true);
    });
  });
});
