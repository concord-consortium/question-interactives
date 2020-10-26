import React from "react";
import { shallow } from "enzyme";
import { Runtime } from "./runtime";
import { IAuthoredState, IInteractiveState } from "./app";
import { getInteractiveSnapshot } from "@concord-consortium/lara-interactive-api";

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
  imageFit: "center",
  imagePosition: "center",
  stampCollections: []
};

const authoredRichState = {
  ...authoredState,
  prompt: "<p><strong>Rich</strong> <em>text</em> <u>prompt</u>"
};

const interactiveState: IInteractiveState = {
  drawingState: "",
  answerType: "interactive_state" as const,
};

describe("Runtime", () => {
  beforeEach(() => {
    getInteractiveSnapshotMock.mockClear();
  });

  it("renders rich text prompt", () => {
    const wrapper = shallow(<Runtime authoredState={authoredRichState} />);
    expect(wrapper.html()).toEqual(expect.stringContaining(authoredRichState.prompt));
  });

  it("renders snapshot button when useSnapshot=true and snapshotTarget is set", () => {
    const wrapperWithoutSnapshot = shallow(<Runtime authoredState={authoredState} interactiveState={interactiveState} />);
    expect(wrapperWithoutSnapshot.find("[data-test='snapshot-btn']").length).toEqual(0);

    const authoredStateWithSnapshot = {...authoredState, backgroundSource: "snapshot" as const, snapshotTarget: "interactive_123"};
    const wrapper = shallow(<Runtime authoredState={authoredStateWithSnapshot} interactiveState={interactiveState} />);

    expect(wrapper.find("[data-test='snapshot-btn']").length).toEqual(1);
    wrapper.find("[data-test='snapshot-btn']").simulate("click");
    expect(getInteractiveSnapshotMock).toHaveBeenCalledWith({ interactiveItemId: "interactive_123" });
  });

  it("renders warning when useSnapshot=true and snapshotTarget is not set", () => {
    const authoredStateWithoutSnapshotTarget = {...authoredState, backgroundSource: "snapshot" as const };
    const wrapper = shallow(<Runtime authoredState={authoredStateWithoutSnapshotTarget} interactiveState={interactiveState} />);

    expect(wrapper.find("[data-test='snapshot-btn']").length).toEqual(0);
    expect(wrapper.text()).toEqual(expect.stringContaining("Snapshot won't work, as no target interactive is selected"));
  });
});
