import React from "react";
import { shallow } from "enzyme";
import { Runtime } from "./runtime";

const authoredState = {
  version: 1,
  prompt: "Test prompt",
  choices: [
    {id: "id1", content: "Choice A"},
    {id: "id2", content: "Choice B"}
  ]
};

const interactiveState = {
  selectedChoiceIds: [ "id2" ]
};

describe("Runtime", () => {
  it("renders prompt, extra instructions and choices", () => {
    const wrapper = shallow(<Runtime authoredState={authoredState} />);
    expect(wrapper.text()).toEqual(expect.stringContaining(authoredState.prompt));
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
    expect(setState).toHaveBeenCalledWith({selectedChoiceIds: ["id1"]});
    wrapper.find("input[value='id2']").simulate("change", { target: { checked: true } });
    expect(setState).toHaveBeenCalledWith({selectedChoiceIds: ["id2"]});
  });

  it("calls setInteractiveState when user selects an answer - multiple answers enabled", () => {
    const setState = jest.fn();
    const wrapper = shallow(<Runtime authoredState={Object.assign({}, authoredState, {multipleAnswers: true})} interactiveState={interactiveState} setInteractiveState={setState}/>);
    wrapper.find("input[value='id1']").simulate("change", { target: { checked: true } });
    expect(setState).toHaveBeenCalledWith({selectedChoiceIds: ["id2", "id1"]});
    // Note that correct state below is an empty array. This is a controlled component, it doesn't have its own state,
    // so the previous click didn't really update interactiveState for it. We're just unchecking initially checked "id2".
    wrapper.find("input[value='id2']").simulate("change", { target: { checked: false } });
    expect(setState).toHaveBeenCalledWith({selectedChoiceIds: []});
  });

  describe("report mode", () => {
    it("renders prompt, extra instructions and *disabled* choices", () => {
      const wrapper = shallow(<Runtime authoredState={authoredState} report={true} />);
      expect(wrapper.text()).toEqual(expect.stringContaining(authoredState.prompt));
      expect(wrapper.text()).toEqual(expect.stringContaining(authoredState.choices[0].content));
      expect(wrapper.text()).toEqual(expect.stringContaining(authoredState.choices[1].content));

      expect(wrapper.find("input[value='id1']").props().disabled).toEqual(true);
      expect(wrapper.find("input[value='id2']").props().disabled).toEqual(true);
    });

    it("handles passed interactiveState", () => {
      const wrapper = shallow(<Runtime authoredState={authoredState} interactiveState={interactiveState} report={true} />);
      expect(wrapper.find("input[value='id1']").props().checked).toEqual(false);
      expect(wrapper.find("input[value='id2']").props().checked).toEqual(true);
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
});
