import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { Runtime } from "./runtime";
import { IInteractiveState } from "./types";

const authoredState = {
  version: 1,
  questionType: "iframe_interactive" as const,
  prompt: "Test prompt",
  hint: "hint",
  scoreBotItemId: "WaterVernalRationale",
  required: true,
  defaultAnswer: "",
  scoreMapping: []
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
    render(<Runtime authoredState={authoredState} />);
    const prompt = screen.getByTestId("legend");
    expect(prompt.innerHTML).toEqual(expect.stringContaining(authoredState.prompt));
    expect(screen.getByTestId("response-textarea")).toBeDefined();
  });

  it("renders rich text prompt and textarea", () => {
    render(<Runtime authoredState={authoredRichState} />);
    const prompt = screen.getByTestId("legend");
    expect(prompt.innerHTML).toEqual(expect.stringContaining(authoredRichState.prompt));
    expect(screen.getByTestId("response-textarea")).toBeDefined();
  });

  it("handles passed interactiveState", () => {
    render(<Runtime authoredState={authoredState} interactiveState={interactiveState} />);
    expect(screen.getByTestId("response-textarea")).toHaveValue(interactiveState.answerText);
  });

  it("calls setInteractiveState when user provides an answer", () => {
    const setState = jest.fn();
    render(<Runtime authoredState={authoredState} interactiveState={interactiveState} setInteractiveState={setState} />);
    fireEvent.change(screen.getByTestId("response-textarea"), { target: { value: "new answer" } });
    const newState = setState.mock.calls[0][0](interactiveState);
    expect(newState).toEqual({answerType: "interactive_state", answerText: "new answer"});
  });

  describe("report mode", () => {
    it("renders prompt and *disabled* textarea", () => {
      render(<Runtime authoredState={authoredState} report={true} />);
      const prompt = screen.getByTestId("legend");
      expect(prompt.innerHTML).toEqual(expect.stringContaining(authoredState.prompt));
      expect(screen.getByTestId("response-textarea")).toHaveAttribute("disabled");
    });

    it("handles passed interactiveState", () => {
      render(<Runtime authoredState={authoredState} interactiveState={interactiveState} report={true} />);
      expect(screen.getByTestId("response-textarea")).toHaveValue(interactiveState.answerText);
    });

    it("never calls setInteractiveState when user selects an answer", () => {
      const setState = jest.fn();
      render(<Runtime authoredState={authoredState} interactiveState={interactiveState} setInteractiveState={setState} report={true} />);
      fireEvent.change(screen.getByTestId("response-textarea"), { target: { value: "diff answer" } });
      expect(setState).not.toHaveBeenCalled();
    });
  });
});
