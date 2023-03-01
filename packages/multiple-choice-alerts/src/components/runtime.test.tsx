/*
  This is a modified version of the standard multiple choice question which uses the LARA interactive
  API showModal() function to show feedback via modal alert rather than inline feedback. At this point
  its sole purpose is to allow manual testing of the modal alert functionality.
 */
import React from "react";
import { mount } from "enzyme";
import { Runtime } from "./runtime";
import { DynamicTextTester } from "@concord-consortium/question-interactives-helpers/src/utilities/dynamic-text-tester";

const authoredState = {
  version: 1,
  questionType: "multiple_choice" as const,
  prompt: "Test prompt",
  choices: [
    {id: "id1", content: "Choice A"},
    {id: "id2", content: "Choice B"}
  ],
  layout: "vertical" as const,
};

const interactiveState = {
  answerType: "multiple_choice_answer" as const,
  selectedChoiceIds: [ "id2" ]
};

describe("Runtime", () => {
  it("renders prompt, extra instructions and choices", () => {
    const wrapper = mount(<DynamicTextTester><Runtime authoredState={authoredState} /></DynamicTextTester>);
    expect(wrapper.text()).toEqual(expect.stringContaining(authoredState.prompt));
    expect(wrapper.text()).toEqual(expect.stringContaining(authoredState.choices[0].content));
    expect(wrapper.text()).toEqual(expect.stringContaining(authoredState.choices[1].content));
  });

  it("renders radio buttons or checkboxes depending on multipleAnswers property", () => {
    let wrapper = mount(<DynamicTextTester><Runtime authoredState={authoredState} /></DynamicTextTester>);
    expect(wrapper.find("input[type='radio']").length).toEqual(2);
    expect(wrapper.find("input[type='checkbox']").length).toEqual(0);
    wrapper = mount(<DynamicTextTester><Runtime authoredState={Object.assign({}, authoredState, {multipleAnswers: true})} /></DynamicTextTester>);
    expect(wrapper.find("input[type='radio']").length).toEqual(0);
    expect(wrapper.find("input[type='checkbox']").length).toEqual(2);
  });

  it("handles passed interactiveState", () => {
    const wrapper = mount(<DynamicTextTester><Runtime authoredState={authoredState} interactiveState={interactiveState} /></DynamicTextTester>);
    expect(wrapper.find("input[value='id1']").props().checked).toEqual(false);
    expect(wrapper.find("input[value='id2']").props().checked).toEqual(true);
  });

  it("calls setInteractiveState when user selects an answer - multiple answers disabled", () => {
    const setState = jest.fn();
    const wrapper = mount(<DynamicTextTester><Runtime authoredState={authoredState} interactiveState={interactiveState} setInteractiveState={setState} /></DynamicTextTester>);
    wrapper.find("input[value='id1']").simulate("change", { target: { checked: true } });
    let newState = setState.mock.calls[0][0](interactiveState);
    expect(newState).toEqual({answerType: "multiple_choice_answer", selectedChoiceIds: ["id1"]});
    wrapper.find("input[value='id2']").simulate("change", { target: { checked: true } });
    newState = setState.mock.calls[1][0](interactiveState);
    expect(newState).toEqual({answerType: "multiple_choice_answer", selectedChoiceIds: ["id2"]});
  });

  it("calls setInteractiveState when user selects an answer - multiple answers enabled", () => {
    const setState = jest.fn();
    const wrapper = mount(<DynamicTextTester><Runtime authoredState={Object.assign({}, authoredState, {multipleAnswers: true})} interactiveState={interactiveState} setInteractiveState={setState}/></DynamicTextTester>);
    wrapper.find("input[value='id1']").simulate("change", { target: { checked: true } });
    let newState = setState.mock.calls[0][0](interactiveState);
    expect(newState).toEqual({answerType: "multiple_choice_answer", selectedChoiceIds: ["id2", "id1"]});
    // Note that correct state below is an empty array. This is a controlled component, it doesn't have its own state,
    // so the previous click didn't really update interactiveState for it. We're just unchecking initially checked "id2".
    wrapper.find("input[value='id2']").simulate("change", { target: { checked: false } });
    newState = setState.mock.calls[1][0](interactiveState);
    expect(newState).toEqual({answerType: "multiple_choice_answer", selectedChoiceIds: []});
  });

  describe("report mode", () => {
    it("renders prompt, extra instructions and *disabled* choices", () => {
      const wrapper = mount(<DynamicTextTester><Runtime authoredState={authoredState} report={true} /></DynamicTextTester>);
      expect(wrapper.text()).toEqual(expect.stringContaining(authoredState.prompt));
      expect(wrapper.text()).toEqual(expect.stringContaining(authoredState.choices[0].content));
      expect(wrapper.text()).toEqual(expect.stringContaining(authoredState.choices[1].content));

      expect(wrapper.find("input[value='id1']").props().disabled).toEqual(true);
      expect(wrapper.find("input[value='id2']").props().disabled).toEqual(true);
    });

    it("handles passed interactiveState", () => {
      const wrapper = mount(<DynamicTextTester><Runtime authoredState={authoredState} interactiveState={interactiveState} report={true} /></DynamicTextTester>);
      expect(wrapper.find("input[value='id1']").props().checked).toEqual(false);
      expect(wrapper.find("input[value='id2']").props().checked).toEqual(true);
    });

    it("never calls setInteractiveState when user selects an answer", () => {
      const setState = jest.fn();
      const wrapper = mount(<DynamicTextTester><Runtime authoredState={authoredState} interactiveState={interactiveState} setInteractiveState={setState} report={true} /></DynamicTextTester>);
      wrapper.find("input[value='id1']").simulate("change", { target: { checked: true } });
      expect(setState).not.toHaveBeenCalled();
      wrapper.find("input[value='id2']").simulate("change", { target: { checked: true } });
      expect(setState).not.toHaveBeenCalled();
    });
  });

  describe("dropdown layout", () => {

    const dropdownAuthoredState = {
      version: 1,
      questionType: "multiple_choice" as const,
      prompt: "Test prompt",
      choices: [
        {id: "id1", content: "Choice A"},
        {id: "id2", content: "Choice B"}
      ],
      layout: "dropdown" as const,
    };

    const dropdownInteractiveState = {
      answerType: "multiple_choice_answer" as const,
      selectedChoiceIds: [ "id2" ],
    };

    it("renders prompt, extra instructions and choices", () => {
      const wrapper = mount(<DynamicTextTester><Runtime authoredState={dropdownAuthoredState} /></DynamicTextTester>);
      expect(wrapper.text()).toEqual(expect.stringContaining(dropdownAuthoredState.prompt));
      expect(wrapper.text()).toEqual(expect.stringContaining(dropdownAuthoredState.choices[0].content));
      expect(wrapper.text()).toEqual(expect.stringContaining(dropdownAuthoredState.choices[1].content));
    });

    it("renders dropdown select", () => {
      const wrapper = mount(<DynamicTextTester><Runtime authoredState={dropdownAuthoredState} /></DynamicTextTester>);
      expect(wrapper.find("option").length).toEqual(3);
      expect(wrapper.find("option").first().text()).toEqual(expect.stringContaining("Select"));
      expect(wrapper.find("option").at(1).text()).toEqual(expect.stringContaining(dropdownAuthoredState.choices[0].content));
    });

    it("handles passed interactiveState", () => {
      const wrapper = mount(<DynamicTextTester><Runtime authoredState={dropdownAuthoredState} interactiveState={dropdownInteractiveState} /></DynamicTextTester>);
      expect(wrapper.find("select").props().value).toEqual("id2");
    });

    it("calls setInteractiveState when user selects an answer", () => {
      const setState = jest.fn();
      const wrapper = mount(<DynamicTextTester><Runtime authoredState={dropdownAuthoredState} interactiveState={dropdownInteractiveState} setInteractiveState={setState} /></DynamicTextTester>);
      expect(wrapper.find("select").props().value).toEqual("id2");
      wrapper.find('select').simulate('change', {target: {value : "id1"}});
      const newState = setState.mock.calls[0][0](interactiveState);
      expect(newState).toEqual({answerType: "multiple_choice_answer", selectedChoiceIds: ["id1"]});
    });

    describe("report mode", () => {

      it("handles passed interactiveState", () => {
        const wrapper = mount(<DynamicTextTester><Runtime authoredState={dropdownAuthoredState} interactiveState={dropdownInteractiveState} report={true} /></DynamicTextTester>);
        expect(wrapper.find("select").props().disabled).toEqual(true);
        expect(wrapper.find("select").props().value).toEqual("id2");
      });
    });
  });
});
