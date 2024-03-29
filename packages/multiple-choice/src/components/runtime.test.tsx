import React from "react";
import { shallow, mount } from "enzyme";
import { Runtime } from "./runtime";
import { DynamicTextContext, DynamicTextInterface } from "@concord-consortium/dynamic-text";

const authoredState = {
  version: 1,
  questionType: "multiple_choice" as const,
  prompt: "Test prompt",
  choices: [
    {id: "id1", content: "Choice A", correct: true},
    {id: "id2", content: "Choice B", correct: false}
  ],
  layout: "vertical" as const,
  enableCheckAnswer: true
};

const interactiveState = {
  answerType: "multiple_choice_answer" as const,
  selectedChoiceIds: [ "id2" ]
};

const dynamicTextTester: DynamicTextInterface = {
  registerComponent: jest.fn(),
  unregisterComponent: jest.fn(),
  selectComponent: jest.fn()
};

describe("Runtime", () => {
  it("renders prompt, extra instructions and choices", () => {
    const wrapper = mount(
      <DynamicTextContext.Provider value={dynamicTextTester}>
        <Runtime authoredState={authoredState} />
      </DynamicTextContext.Provider>
    );
    const prompt = wrapper.find("legend");
    expect(prompt.html()).toEqual(expect.stringContaining(authoredState.prompt));
    expect(wrapper.text()).toEqual(expect.stringContaining(authoredState.choices[0].content));
    expect(wrapper.text()).toEqual(expect.stringContaining(authoredState.choices[1].content));
  });

  it("renders radio buttons or checkboxes depending on multipleAnswers property", () => {
    let wrapper = shallow(<Runtime authoredState={authoredState} />);
    expect(wrapper.find("input[type='radio']").length).toEqual(2);
    expect(wrapper.find("input[type='checkbox']").length).toEqual(0);
    wrapper = shallow(<Runtime authoredState={Object.assign({}, authoredState, {multipleAnswers: true})} />);
    expect(wrapper.find("input[type='radio']").length).toEqual(0);
    expect(wrapper.find("input[type='checkbox']").length).toEqual(2);
  });

  it("handles passed interactiveState", () => {
    const wrapper = shallow(<Runtime authoredState={authoredState} interactiveState={interactiveState} />);
    expect(wrapper.find("input[value='id1']").props().checked).toEqual(false);
    expect(wrapper.find("input[value='id2']").props().checked).toEqual(true);
  });

  it("calls setInteractiveState when user selects an answer - multiple answers disabled", () => {
    const setState = jest.fn();
    const wrapper = shallow(<Runtime authoredState={authoredState} interactiveState={interactiveState} setInteractiveState={setState} />);
    wrapper.find("input[value='id1']").simulate("change", { target: { checked: true } });
    let newState = setState.mock.calls[0][0](interactiveState);
    expect(newState).toEqual({answerType: "multiple_choice_answer", selectedChoiceIds: ["id1"], answerText: "(correct) Choice A"});
    wrapper.find("input[value='id2']").simulate("change", { target: { checked: true } });
    newState = setState.mock.calls[1][0](interactiveState);
    expect(newState).toEqual({answerType: "multiple_choice_answer", selectedChoiceIds: ["id2"], answerText: "Choice B"});
  });

  it("calls setInteractiveState when user selects an answer - multiple answers enabled", () => {
    const setState = jest.fn();
    const wrapper = shallow(<Runtime authoredState={Object.assign({}, authoredState, {multipleAnswers: true})} interactiveState={interactiveState} setInteractiveState={setState}/>);
    wrapper.find("input[value='id1']").simulate("change", { target: { checked: true } });
    let newState = setState.mock.calls[0][0](interactiveState);
    expect(newState).toEqual({answerType: "multiple_choice_answer", selectedChoiceIds: ["id2", "id1"], answerText: "Choice B, (correct) Choice A"});
    // Note that correct state below is an empty array. This is a controlled component, it doesn't have its own state,
    // so the previous click didn't really update interactiveState for it. We're just unchecking initially checked "id2".
    wrapper.find("input[value='id2']").simulate("change", { target: { checked: false } });
    newState = setState.mock.calls[1][0](interactiveState);
    expect(newState).toEqual({answerType: "multiple_choice_answer", selectedChoiceIds: [], answerText: ""});
  });

  it("has a Check Answer button that is disabled until an answer is selected", () => {
    const setState = jest.fn();
    interactiveState.selectedChoiceIds = [];
    const wrapper = shallow(<Runtime authoredState={authoredState} interactiveState={interactiveState} setInteractiveState={setState} />);
    const checkAnswerButton = wrapper.find("[data-cy='check-answer-button']");
    expect(checkAnswerButton.length).toEqual(1);
    expect(checkAnswerButton.props().disabled).toEqual(true);
  });

  it("has a Check Answer button that is enabled when an answer is selected and when clicked shows correct feedback when correct answer is selected", () => {
    const setState = jest.fn();
    interactiveState.selectedChoiceIds = ['id1'];
    const wrapper = mount(
      <DynamicTextContext.Provider value={dynamicTextTester}>
        <Runtime authoredState={authoredState} interactiveState={interactiveState} setInteractiveState={setState} />)
      </DynamicTextContext.Provider>
    );
    const checkAnswerButton = wrapper.find("[data-cy='check-answer-button']");
    expect(checkAnswerButton.length).toEqual(1);
    expect(checkAnswerButton.props().disabled).toEqual(false);
    checkAnswerButton.simulate("click");
    expect(wrapper.find(".answerFeedback").length).toEqual(1);
    expect(wrapper.find(".correctSymbol").length).toEqual(1);
    expect(wrapper.find(".feedback").text()).toEqual("Yes! You are correct.");
  });

  it("has a Check Answer button that is enabled when at least one answer in a multiple-answer MC question is selected and when clicked shows partially correct feedback if only one of many correct answers is selected", () => {
    const setState = jest.fn();
    interactiveState.selectedChoiceIds = ['id1'];
    const multiChoices = [
      {id: "id1", content: "Choice A", correct: true},
      {id: "id2", content: "Choice B", correct: false},
      {id: "id3", content: "Choice C", correct: true}
    ];
    const wrapper = mount(
      <DynamicTextContext.Provider value={dynamicTextTester}>
        <Runtime authoredState={Object.assign({}, authoredState, {choices: multiChoices, multipleAnswers: true})} interactiveState={interactiveState} setInteractiveState={setState} />
      </DynamicTextContext.Provider>
    );
    const checkAnswerButton = wrapper.find("[data-cy='check-answer-button']");
    checkAnswerButton.simulate("click");
    expect(wrapper.find(".answerFeedback").length).toEqual(1);
    expect(wrapper.find(".feedback").text()).toEqual("You're on the right track, but you didn't select all the right answers yet.");
  });

  it("has a Check Answer button that is enabled when multiple answers in a multiple-answer MC question are selected and when clicked shows correct feedback if all correct answers are selected", () => {
    const setState = jest.fn();
    interactiveState.selectedChoiceIds = ['id1', 'id3'];
    const multiChoices = [
      {id: "id1", content: "Choice A", correct: true},
      {id: "id2", content: "Choice B", correct: false},
      {id: "id3", content: "Choice C", correct: true}
    ];
    const wrapper = mount(
      <DynamicTextContext.Provider value={dynamicTextTester}>
        <Runtime authoredState={Object.assign({}, authoredState, {choices: multiChoices, multipleAnswers: true})} interactiveState={interactiveState} setInteractiveState={setState} />
      </DynamicTextContext.Provider>
    );
    const checkAnswerButton = wrapper.find("[data-cy='check-answer-button']");
    checkAnswerButton.simulate("click");
    expect(wrapper.find(".answerFeedback").length).toEqual(1);
    expect(wrapper.find(".feedback").text()).toEqual("Yes! You are correct.");
  });

  it("has a Check Answer button that is enabled when an answer is selected and when clicked shows incorrect feedback if an incorrect answer is selected", () => {
    const setState = jest.fn();
    interactiveState.selectedChoiceIds = ['id2'];
    const wrapper = mount(
      <DynamicTextContext.Provider value={dynamicTextTester}>
        <Runtime authoredState={authoredState} interactiveState={interactiveState} setInteractiveState={setState} />
      </DynamicTextContext.Provider>
    );
    const checkAnswerButton = wrapper.find("[data-cy='check-answer-button']");
    expect(checkAnswerButton.length).toEqual(1);
    expect(checkAnswerButton.props().disabled).toEqual(false);
    checkAnswerButton.simulate("click");
    expect(wrapper.find(".answerFeedback").length).toEqual(1);
    expect(wrapper.find(".incorrectSymbol").length).toEqual(1);
    expect(wrapper.find(".feedback").text()).toEqual("Sorry, that is incorrect.");
  });

  describe("report mode", () => {
    it("renders prompt, extra instructions and *disabled* choices", () => {
      const wrapper = mount(
        <DynamicTextContext.Provider value={dynamicTextTester}>
          <Runtime authoredState={authoredState} report={true} />
        </DynamicTextContext.Provider>
      );
      const prompt = wrapper.find("legend");
      expect(prompt.html()).toEqual(expect.stringContaining(authoredState.prompt));
      expect(wrapper.text()).toEqual(expect.stringContaining(authoredState.choices[0].content));
      expect(wrapper.text()).toEqual(expect.stringContaining(authoredState.choices[1].content));

      expect(wrapper.find("input[value='id1']").props().disabled).toEqual(true);
      expect(wrapper.find("input[value='id2']").props().disabled).toEqual(true);

      expect(wrapper.find(".radio-choice").at(0).props().className).toMatch(/incorrectChoice/);
    });

    it("handles passed interactiveState", () => {
      const wrapper = shallow(<Runtime authoredState={authoredState} interactiveState={interactiveState} report={true} />);
      expect(wrapper.find("input[value='id1']").props().checked).toEqual(false);
      expect(wrapper.find("input[value='id2']").props().checked).toEqual(true);
      expect(wrapper.find(".radio-choice").at(0).props().className).toMatch(/correctChoice/);
    });

    it("never calls setInteractiveState when user selects an answer", () => {
      const setState = jest.fn();
      const wrapper = shallow(<Runtime authoredState={authoredState} interactiveState={interactiveState} setInteractiveState={setState} report={true} />);
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
      const wrapper = mount(
        <DynamicTextContext.Provider value={dynamicTextTester}>
          <Runtime authoredState={dropdownAuthoredState} />
        </DynamicTextContext.Provider>
      );
      const prompt = wrapper.find("legend");
      expect(prompt.html()).toEqual(expect.stringContaining(dropdownAuthoredState.prompt));
      expect(wrapper.text()).toEqual(expect.stringContaining(dropdownAuthoredState.choices[0].content));
      expect(wrapper.text()).toEqual(expect.stringContaining(dropdownAuthoredState.choices[1].content));
    });

    it("renders dropdown select", () => {
      const wrapper = shallow(<Runtime authoredState={dropdownAuthoredState} />);
      expect(wrapper.find("option").length).toEqual(3);
      expect(wrapper.find("option").first().text()).toEqual(expect.stringContaining("Select"));
      expect(wrapper.find("option").at(1).text()).toEqual(expect.stringContaining(dropdownAuthoredState.choices[0].content));
    });

    it("handles passed interactiveState", () => {
      const wrapper = shallow(<Runtime authoredState={dropdownAuthoredState} interactiveState={dropdownInteractiveState} />);
      expect(wrapper.find("select").props().value).toEqual("id2");
    });

    it("calls setInteractiveState when user selects an answer", () => {
      const setState = jest.fn();
      const wrapper = shallow(<Runtime authoredState={dropdownAuthoredState} interactiveState={dropdownInteractiveState} setInteractiveState={setState} />);
      expect(wrapper.find("select").props().value).toEqual("id2");
      wrapper.find('select').simulate('change', {target: {value : "id1"}});
      const newState = setState.mock.calls[0][0](interactiveState);
      expect(newState).toEqual({answerType: "multiple_choice_answer", selectedChoiceIds: ["id1"], answerText: "Choice A"});
    });

    describe("report mode", () => {

      it("handles passed interactiveState", () => {
        const wrapper = shallow(<Runtime authoredState={dropdownAuthoredState} interactiveState={dropdownInteractiveState} report={true} />);
        expect(wrapper.find("select").props().disabled).toEqual(true);
        expect(wrapper.find("select").props().value).toEqual("id2");
      });
    });
  });
});
