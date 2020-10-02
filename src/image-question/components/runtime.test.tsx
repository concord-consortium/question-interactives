import React from "react";
import { shallow } from "enzyme";
import { Runtime } from "./runtime";
import { IAuthoredState, IInteractiveState } from "./app";
import { getInteractiveSnapshot } from "@concord-consortium/lara-interactive-api";
import {act} from "react-dom/test-utils";

jest.mock("@concord-consortium/lara-interactive-api", () => ({
  getInteractiveSnapshot: jest.fn(() => new Promise(resolve => resolve({success: true, snapshotUrl: "http://snapshot/123" })))
}));
const getInteractiveSnapshotMock = getInteractiveSnapshot as jest.Mock;


const authoredState: IAuthoredState = {
  version: 1,
  questionType: "iframe_interactive" as const,
  prompt: "Test prompt",
  hint: "hint",
  required: false,
  defaultAnswer: "",
  imageFit: "center",
  imagePosition: "center",
  stampCollections: [],
  answerType: "image_question_answer"
};

const authoredRichState = {
  ...authoredState,
  prompt: "<p><strong>Rich</strong> <em>text</em> <u>prompt</u>"
};

const interactiveState: IInteractiveState = {
  drawingState: "",
  answerType: "interactive_state" as const,
  answerText: "Test answer",
};

describe("Runtime", () => {
  beforeEach(() => {
    getInteractiveSnapshotMock.mockClear();
  });

  it("renders prompt and textarea", () => {
    const wrapper = shallow(<Runtime authoredState={authoredState} />);
    expect(wrapper.find("textarea").length).toEqual(1);
  });

  it("renders rich text prompt and textarea", () => {
    const wrapper = shallow(<Runtime authoredState={authoredRichState} />);
    const prompt = wrapper.find("legend");
    expect(prompt.html()).toEqual(expect.stringContaining(authoredRichState.prompt));
    expect(wrapper.find("textarea").length).toEqual(1);
  });

  it("renders drawing tool", () => {
    const wrapper = shallow(<Runtime authoredState={authoredRichState} />);
    expect(wrapper.find("div").length).toEqual(1);
  });

  it("handles passed interactiveState", () => {
    const wrapper = shallow(<Runtime authoredState={authoredState} interactiveState={interactiveState} />);
    expect(wrapper.find("textarea").props().value).toEqual(interactiveState.answerText);
  });

  it("calls setInteractiveState when user provides an answer", () => {
    const setState = jest.fn();
    const wrapper = shallow(<Runtime authoredState={authoredState} interactiveState={interactiveState} setInteractiveState={setState} />);
    wrapper.find("textarea").simulate("change", { target: { value: "new answer" } });
    const newState = setState.mock.calls[0][0](interactiveState);
    expect(newState).toEqual({answerType: "interactive_state", drawingState: "", answerText: "new answer"});
  });

  it("renders snapshot button when useSnapshot=true and snapshotTarget is set", () => {
    const wrapperWithoutSnapshot = shallow(<Runtime authoredState={authoredState} interactiveState={interactiveState} />);
    expect(wrapperWithoutSnapshot.find("[data-test='snapshot-btn']").length).toEqual(0);

    const authoredStateWithSnapshot = {...authoredState, useSnapshot: true, snapshotTarget: "interactive_123"};
    const wrapper = shallow(<Runtime authoredState={authoredStateWithSnapshot} interactiveState={interactiveState} />);

    expect(wrapper.find("[data-test='snapshot-btn']").length).toEqual(1);
    wrapper.find("[data-test='snapshot-btn']").simulate("click");
    expect(getInteractiveSnapshotMock).toHaveBeenCalledWith({ interactiveItemId: "interactive_123" });
  });

  it("renders warning when useSnapshot=true and snapshotTarget is not set", () => {
    const authoredStateWithoutSnapshotTarget = {...authoredState, useSnapshot: true };
    const wrapper = shallow(<Runtime authoredState={authoredStateWithoutSnapshotTarget} interactiveState={interactiveState} />);

    expect(wrapper.find("[data-test='snapshot-btn']").length).toEqual(0);
    expect(wrapper.text()).toEqual(expect.stringContaining("Snapshot won't work, as the target interactive is not selected"));
  });

  describe("report mode", () => {
    it("renders prompt and *disabled* textarea", () => {
      const wrapper = shallow(<Runtime authoredState={authoredState} report={true} />);
      expect(wrapper.find("textarea").props().disabled).toEqual(true);
    });

    it("handles passed interactiveState", () => {
      const wrapper = shallow(<Runtime authoredState={authoredState} interactiveState={interactiveState} report={true} />);
      expect(wrapper.find("textarea").props().value).toEqual(interactiveState.answerText);
    });
  });
});
