import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { Runtime } from "./runtime";
import { IInteractiveState } from "./types";
import { DynamicTextTester } from "@concord-consortium/question-interactives-helpers/src/utilities/dynamic-text-tester";

const authoredState = {
  version: 1,
  questionType: "iframe_interactive" as const,
  prompt: "Test prompt",
  hint: "hint",
  required: true,
  defaultAnswer: "",
  scoreBotItemId: "foo",
  scoreMapping: ["0", "1", "2", "3", "4"]
};

const authoredRichState = {
  ...authoredState,
  prompt: "<p><strong>Rich</strong> <em>text</em> <u>prompt</u>"
};

const interactiveState: IInteractiveState = {
  answerType: "interactive_state" as const,
  answerText: "Test answer"
};

describe("Runtime", () => {
  it("renders prompt and textarea", () => {
    render(<DynamicTextTester><Runtime authoredState={authoredState} /></DynamicTextTester>);
    const prompt = screen.getByTestId("legend");
    expect(prompt.innerHTML).toEqual(expect.stringContaining(authoredState.prompt));
    expect(screen.getByTestId("response-textarea")).toBeDefined();
  });

  it("renders rich text prompt and textarea", () => {
    render(<DynamicTextTester><Runtime authoredState={authoredRichState} /></DynamicTextTester>);
    const prompt = screen.getByTestId("legend");
    expect(prompt.innerHTML).toEqual(expect.stringContaining(authoredRichState.prompt));
    expect(screen.getByTestId("response-textarea")).toBeDefined();
  });

  it("handles passed interactiveState", () => {
    render(<DynamicTextTester><Runtime authoredState={authoredState} interactiveState={interactiveState} /></DynamicTextTester>);
    expect(screen.getByTestId("response-textarea")).toHaveValue(interactiveState.answerText);
  });

  it("calls setInteractiveState when user provides an answer", () => {
    const setState = jest.fn();
    render(<DynamicTextTester><Runtime authoredState={authoredState} interactiveState={interactiveState} setInteractiveState={setState} /></DynamicTextTester>);
    fireEvent.change(screen.getByTestId("response-textarea"), { target: { value: "new answer" } });
    const newState = setState.mock.calls[0][0](interactiveState);
    expect(newState).toEqual({answerType: "interactive_state", answerText: "new answer", score: undefined, submitted: true});
  });

  describe("report mode", () => {
    it("renders prompt and *disabled* textarea", () => {
      render(<DynamicTextTester><Runtime authoredState={authoredState} report={true} /></DynamicTextTester>);
      const prompt = screen.getByTestId("legend");
      expect(prompt.innerHTML).toEqual(expect.stringContaining(authoredState.prompt));
      expect(screen.getByTestId("response-textarea")).toHaveAttribute("disabled");
    });

    it("handles passed interactiveState", () => {
      render(<DynamicTextTester><Runtime authoredState={authoredState} interactiveState={interactiveState} report={true} /></DynamicTextTester>);
      expect(screen.getByTestId("response-textarea")).toHaveValue(interactiveState.answerText);
    });

    it("never calls setInteractiveState when user selects an answer", () => {
      const setState = jest.fn();
      render(<DynamicTextTester><Runtime authoredState={authoredState} interactiveState={interactiveState} setInteractiveState={setState} report={true} /></DynamicTextTester>);
      fireEvent.change(screen.getByTestId("response-textarea"), { target: { value: "diff answer" } });
      expect(setState).not.toHaveBeenCalled();
    });
  });
});
