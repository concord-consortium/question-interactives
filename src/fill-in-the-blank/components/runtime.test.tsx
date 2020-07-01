import React from "react";
import { fireEvent, render } from "@testing-library/react";
import { Runtime, replaceBlanksWithInputs, replaceBlanksWithValues } from "./runtime";
import { IAuthoredState, IInteractiveState } from "./types";

const authoredState: IAuthoredState = {
  version: 1,
  questionType: "iframe_interactive",
  prompt: "<p>Test prompt with [blank-1] and [blank-2].</p>",
  blanks: [
    {id: "[blank-1]", size: 10},
    {id: "[blank-2]", size: 20, matchTerm: "Expected answer"}
  ]
};

const brokenAuthoredState: IAuthoredState = {
  version: 1,
  questionType: "iframe_interactive",
  prompt: "<p>Test prompt with [blank-1] and [blank-2].</p>",
  blanks: [
    {id: "[blank-3]", size: 10}
  ]
};

const interactiveState: IInteractiveState = {
  answerType: "interactive_state",
  blanks: [
    {id: "[blank-1]", response: "Test response"}
  ]
};

const correctInteractiveState: IInteractiveState = {
  answerType: "interactive_state",
  blanks: [
    {id: "[blank-1]", response: "Test response"},
    {id: "[blank-2]", response: "Expected answer"}
  ]
};

describe("Runtime", () => {

  it("renders prompt and inputs", () => {
    const { container, getByText } = render(<Runtime authoredState={authoredState} />);
    expect(getByText("Test prompt with", { exact: false })).toBeDefined();
    const inputs = container.querySelectorAll("input");
    expect(inputs.length).toBe(2);
    expect(inputs[0].id).toBe("[blank-1]");
    expect(inputs[0].size).toBe(10);
    expect(inputs[1].id).toBe("[blank-2]");
    expect(inputs[1].size).toBe(20);
  });

  it("handles passed interactiveState", () => {
    const { container } = render(<Runtime authoredState={authoredState} interactiveState={interactiveState} />);
    const inputs = container.querySelectorAll("input");
    expect(inputs[0].value).toEqual(interactiveState.blanks[0].response);
    expect(inputs[1].value).toEqual("");
  });

  it("renders minimal states", () => {
    const minimalAuthoredState: IAuthoredState = { version: 1, questionType: "iframe_interactive" };
    const minimalInteractiveState: IInteractiveState = { answerType: "interactive_state" } as any;
    const { container } = render(<Runtime authoredState={minimalAuthoredState} interactiveState={minimalInteractiveState} />);
    const inputs = container.querySelectorAll("input");
    expect(inputs.length).toBe(0);
  });

  it("calls setInteractiveState when user provides an answer", () => {
    const setState = jest.fn();
    const { container } = render(<Runtime authoredState={authoredState} interactiveState={interactiveState} setInteractiveState={setState} />);
    const inputs = container.querySelectorAll("input");
    fireEvent.change(inputs[1], { target: { value: "New response" } });
    const newState = setState.mock.calls[0][0](interactiveState);
    expect(newState).toEqual({
      answerType: "interactive_state",
      answerText: "Test prompt with [ Test response ] and [ New response ].",
      blanks: [
        {id: "[blank-1]", response: "Test response"},
        {id: "[blank-2]", response: "New response"}
      ]
    });

    fireEvent.change(inputs[1], { target: { value: "Newer response" } });
    const newerState = setState.mock.calls[1][0](newState);
    expect(newerState).toEqual({
      answerType: "interactive_state",
      answerText: "Test prompt with [ Test response ] and [ Newer response ].",
      blanks: [
        {id: "[blank-1]", response: "Test response"},
        {id: "[blank-2]", response: "Newer response"}
      ]
    });
  });

  describe("report mode", () => {
    it("renders prompt and *disabled* inputs", () => {
      const { container, getByText } = render(<Runtime authoredState={authoredState} report={true} />);
      expect(getByText("Test prompt with", { exact: false })).toBeDefined();
      const inputs = container.querySelectorAll("input");
      expect(inputs.length).toEqual(2);
      expect(inputs[0].disabled).toEqual(true);
      expect(inputs[1].disabled).toEqual(true);
    });

    it("handles passed interactiveState", () => {
      const { container } = render(<Runtime authoredState={authoredState} interactiveState={interactiveState} report={true} />);
      const inputs = container.querySelectorAll("input");
      expect(inputs[0].value).toEqual(interactiveState.blanks[0].response);
      expect(inputs[1].value).toEqual("");
    });
  });
});

describe("replaceBlanksWithValues helper", () => {
  it("returns string containing input field values", () => {
    const result = replaceBlanksWithValues({
                    prompt: authoredState.prompt!,
                    blanks: authoredState.blanks!,
                    responses: interactiveState.blanks
                  });
    expect(result).toEqual("<p>Test prompt with [ Test response ] and [  ].</p>");
  });
});

describe("replaceBlanksWithInputs helper", () => {
  it("returns string containing input fields for user interaction", () => {
    const result = replaceBlanksWithInputs(authoredState.prompt!);
    const input1 = `<input id="[blank-1]"/>`;
    const input2 = `<input id="[blank-2]"/>`;
    expect(result).toBe(`<p>Test prompt with ${input1} and ${input2}.</p>`);
  });

  it("returns string containing input fields for user interaction", () => {
    const result = replaceBlanksWithInputs(authoredState.prompt!);
    const input1 = `<input id="[blank-1]"/>`;
    const input2 = `<input id="[blank-2]"/>`;
    expect(result).toBe(`<p>Test prompt with ${input1} and ${input2}.</p>`);
  });
  it("returns string containing input fields for user interaction", () => {
    const result = replaceBlanksWithInputs(brokenAuthoredState.prompt!);
    const input1 = `<input id="[blank-1]"/>`;
    const input2 = `<input id="[blank-2]"/>`;
    expect(result).toBe(`<p>Test prompt with ${input1} and ${input2}.</p>`);
  });
});
