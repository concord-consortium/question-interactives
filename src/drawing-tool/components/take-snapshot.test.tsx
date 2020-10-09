import React from "react";
import { shallow } from "enzyme";
import { TakeSnapshot } from "./take-snapshot";
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

const interactiveState: IInteractiveState = {
  answerType: "interactive_state" as const,
};

describe("TakeSnapshot", () => {
  beforeEach(() => {
    getInteractiveSnapshotMock.mockClear();
  });

  it("renders snapshot button when snapshotTarget is set", () => {
    const authoredStateWithSnapshot = {...authoredState, snapshotTarget: "interactive_123"};
    const wrapper = shallow(<TakeSnapshot authoredState={authoredStateWithSnapshot} interactiveState={interactiveState} />);

    expect(wrapper.find("[data-test='snapshot-btn']").length).toEqual(1);
    wrapper.find("[data-test='snapshot-btn']").simulate("click");
    expect(getInteractiveSnapshotMock).toHaveBeenCalledWith({ interactiveItemId: "interactive_123" });
  });

  it("renders warning snapshotTarget is not set", () => {
    const authoredStateWithoutSnapshotTarget = {...authoredState };
    const wrapper = shallow(<TakeSnapshot authoredState={authoredStateWithoutSnapshotTarget} interactiveState={interactiveState} />);

    expect(wrapper.find("[data-test='snapshot-btn']").length).toEqual(0);
    expect(wrapper.text()).toEqual(expect.stringContaining("Snapshot won't work, as no target interactive is selected"));
  });
});
