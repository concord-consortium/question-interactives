import React from "react";
import { fireEvent, render } from "@testing-library/react";
import { Runtime, blankContextId, getBlankAriaLabel, getBlankLabelContext, getPromptContextDescription, replaceBlanksWithInputs, replaceBlanksWithValues } from "./runtime";
import { IAuthoredState, IInteractiveState } from "./types";
import { DynamicTextTester } from "@concord-consortium/question-interactives-helpers/src/utilities/dynamic-text-tester";

const authoredState = {
  version: 1,
  questionType: "iframe_interactive" as const,
  prompt: "<p>Test prompt with [blank-1] and [blank-2].</p>",
  blanks: [
    {id: "[blank-1]", size: 10},
    {id: "[blank-2]", size: 20, matchTerm: "Expected answer"}
  ]
};

const brokenAuthoredState = {
  version: 1,
  questionType: "iframe_interactive" as const,
  prompt: "<p>Test prompt with [blank-1] and [blank-2].</p>",
  blanks: [
    {id: "[blank-3]", size: 10}
  ]
};

const interactiveState: IInteractiveState = {
  answerType: "interactive_state" as const,
  blanks: [
    {id: "[blank-1]", response: "Test response"}
  ]
};

describe("Runtime", () => {

  it("renders prompt and inputs", () => {
    const { container, getByText } = render(<DynamicTextTester><Runtime authoredState={authoredState} /></DynamicTextTester>);
    expect(getByText("Test prompt with", { exact: false, selector: "p" })).toBeDefined();
    const inputs = container.querySelectorAll("input");
    expect(inputs.length).toBe(2);
    expect(inputs[0].id).toBe("[blank-1]");
    expect(inputs[0].size).toBe(10);
    expect(inputs[1].id).toBe("[blank-2]");
    expect(inputs[1].size).toBe(20);
  });

  it("handles passed interactiveState", () => {
    const { container } = render(<DynamicTextTester><Runtime authoredState={authoredState} interactiveState={interactiveState} /></DynamicTextTester>);
    const inputs = container.querySelectorAll("input");
    expect(inputs[0].value).toEqual(interactiveState.blanks[0].response);
    expect(inputs[1].value).toEqual("");
  });

  it("renders minimal states", () => {
    const minimalAuthoredState: IAuthoredState = { version: 1, questionType: "iframe_interactive" };
    const minimalInteractiveState: IInteractiveState = { answerType: "interactive_state" } as any;
    const { container } = render(<DynamicTextTester><Runtime authoredState={minimalAuthoredState} interactiveState={minimalInteractiveState} /></DynamicTextTester>);
    const inputs = container.querySelectorAll("input");
    expect(inputs.length).toBe(0);
  });

  it("calls setInteractiveState when user provides an answer", () => {
    const setState = jest.fn();
    const { container } = render(<DynamicTextTester><Runtime authoredState={authoredState} interactiveState={interactiveState} setInteractiveState={setState} /></DynamicTextTester>);
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

  it("gives each input a concise positional aria-label", () => {
    const { container } = render(<DynamicTextTester><Runtime authoredState={authoredState} /></DynamicTextTester>);
    const inputs = container.querySelectorAll("input");
    expect(inputs[0].getAttribute("aria-label")).toBe("Blank 1 of 2");
    expect(inputs[1].getAttribute("aria-label")).toBe("Blank 2 of 2");
  });

  it("describes each input with a hidden, shared full-prompt context element", () => {
    const { container } = render(<DynamicTextTester><Runtime authoredState={authoredState} /></DynamicTextTester>);
    const inputs = container.querySelectorAll("input");
    // every input points at the same context element
    expect(inputs[0].getAttribute("aria-describedby")).toBe(blankContextId);
    expect(inputs[1].getAttribute("aria-describedby")).toBe(blankContextId);
    // the referenced element exists, is hidden, and holds the full prompt text
    const context = container.querySelector(`#${blankContextId}`) as HTMLElement;
    expect(context).not.toBeNull();
    expect(context.hidden).toBe(true);
    expect(context.textContent).toBe("Full text: Test prompt with blank and blank.");
  });

  it("does not render the context element when the prompt has no blanks", () => {
    const noBlanks: IAuthoredState = { version: 1, questionType: "iframe_interactive", prompt: "<p>No blanks here.</p>" };
    const { container } = render(<DynamicTextTester><Runtime authoredState={noBlanks} /></DynamicTextTester>);
    expect(container.querySelector(`#${blankContextId}`)).toBeNull();
  });

  describe("report mode", () => {
    it("renders prompt and *disabled* inputs", () => {
      const { container, getByText } = render(<DynamicTextTester><Runtime authoredState={authoredState} report={true} /></DynamicTextTester>);
      expect(getByText("Test prompt with", { exact: false, selector: "p" })).toBeDefined();
      const inputs = container.querySelectorAll("input");
      expect(inputs.length).toEqual(2);
      expect(inputs[0].disabled).toEqual(true);
      expect(inputs[1].disabled).toEqual(true);
    });

    it("handles passed interactiveState", () => {
      const { container } = render(<DynamicTextTester><Runtime authoredState={authoredState} interactiveState={interactiveState} report={true} /></DynamicTextTester>);
      const inputs = container.querySelectorAll("input");
      expect(inputs[0].value).toEqual(interactiveState.blanks[0].response);
      expect(inputs[1].value).toEqual("");
    });
  });
});

describe("replaceBlanksWithValues helper", () => {
  it("returns string containing input field values", () => {
    const result = replaceBlanksWithValues({
                    prompt: authoredState.prompt,
                    blanks: authoredState.blanks,
                    responses: interactiveState.blanks
                  });
    expect(result).toEqual("<p>Test prompt with [ Test response ] and [  ].</p>");
  });
});

describe("getBlankLabelContext helper", () => {
  it("strips HTML and reads blank tokens as the word 'blank'", () => {
    expect(getBlankLabelContext("<p>Test prompt with [blank-1] and [blank-2].</p>"))
      .toBe("Test prompt with blank and blank.");
  });

  it("handles an empty prompt", () => {
    expect(getBlankLabelContext("")).toBe("");
  });
});

describe("getBlankAriaLabel helper", () => {
  const prompt = "<p>Test prompt with [blank-1] and [blank-2].</p>";

  it("returns the blank's position when there are multiple blanks", () => {
    expect(getBlankAriaLabel(prompt, "[blank-1]")).toBe("Blank 1 of 2");
    expect(getBlankAriaLabel(prompt, "[blank-2]")).toBe("Blank 2 of 2");
  });

  it("derives position from prompt order, not the id", () => {
    const reordered = "<p>[blank-2] comes before [blank-1].</p>";
    expect(getBlankAriaLabel(reordered, "[blank-2]")).toBe("Blank 1 of 2");
    expect(getBlankAriaLabel(reordered, "[blank-1]")).toBe("Blank 2 of 2");
  });

  it("omits the count when there is only one blank", () => {
    expect(getBlankAriaLabel("<p>There is one [blank-1].</p>", "[blank-1]")).toBe("Blank");
  });

  it("falls back to a generic label when the blankId is not in the prompt", () => {
    expect(getBlankAriaLabel(prompt, "[blank-3]")).toBe("Blank");
  });
});

describe("getPromptContextDescription helper", () => {
  it("prefixes the plain-text prompt with a 'Full text:' label", () => {
    expect(getPromptContextDescription("<p>Test prompt with [blank-1] and [blank-2].</p>"))
      .toBe("Full text: Test prompt with blank and blank.");
  });
});

describe("replaceBlanksWithInputs helper", () => {
  it("returns string containing input fields for user interaction", () => {
    const result = replaceBlanksWithInputs(authoredState.prompt);
    const input1 = `<input id="[blank-1]"/>`;
    const input2 = `<input id="[blank-2]"/>`;
    expect(result).toBe(`<p>Test prompt with ${input1} and ${input2}.</p>`);
  });

  it("returns string containing input fields for user interaction", () => {
    const result = replaceBlanksWithInputs(authoredState.prompt);
    const input1 = `<input id="[blank-1]"/>`;
    const input2 = `<input id="[blank-2]"/>`;
    expect(result).toBe(`<p>Test prompt with ${input1} and ${input2}.</p>`);
  });
  it("returns string containing input fields for user interaction", () => {
    const result = replaceBlanksWithInputs(brokenAuthoredState.prompt);
    const input1 = `<input id="[blank-1]"/>`;
    const input2 = `<input id="[blank-2]"/>`;
    expect(result).toBe(`<p>Test prompt with ${input1} and ${input2}.</p>`);
  });
});
