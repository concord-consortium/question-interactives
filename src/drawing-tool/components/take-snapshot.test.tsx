import React from "react";
import { shallow } from "enzyme";
import { TakeSnapshot } from "./take-snapshot";
import { IAuthoredState, IInteractiveState } from "./types";
import { getInteractiveSnapshot, useInitMessage } from "@concord-consortium/lara-interactive-api";

jest.mock("@concord-consortium/lara-interactive-api", () => ({
  getInteractiveSnapshot: jest.fn(() => new Promise(resolve => resolve({success: true, snapshotUrl: "http://snapshot/123" }))),
  useInitMessage: jest.fn()
}));
const getInteractiveSnapshotMock = getInteractiveSnapshot as jest.Mock;
const useInitMessageMock = useInitMessage as jest.Mock;

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

const initMessageWithSnapshotTarget = {
  mode: "runtime",
  linkedInteractives: [
    {
      id: "123-MwInteractive",
      label: "snapshotTarget"
    }
  ]
};

const initMessageWithoutSnapshotTarget = {
  mode: "runtime",
  linkedInteractives: []
};

describe("TakeSnapshot", () => {
  beforeEach(() => {
    getInteractiveSnapshotMock.mockClear();
    useInitMessageMock.mockClear();
  });

  it("renders snapshot button when snapshotTarget is set", () => {
    useInitMessageMock.mockReturnValue(initMessageWithSnapshotTarget);
    const wrapper = shallow(<TakeSnapshot authoredState={authoredState} interactiveState={interactiveState} />);

    expect(wrapper.find("[data-test='snapshot-btn']").length).toEqual(1);
    wrapper.find("[data-test='snapshot-btn']").simulate("click");
    expect(getInteractiveSnapshotMock).toHaveBeenCalledWith({ interactiveItemId: "123-MwInteractive" });
  });

  it("renders warning snapshotTarget is not set", () => {
    useInitMessageMock.mockReturnValue(initMessageWithoutSnapshotTarget);
    const wrapper = shallow(<TakeSnapshot authoredState={authoredState} interactiveState={interactiveState} />);

    expect(wrapper.find("[data-test='snapshot-btn']").length).toEqual(0);
    expect(wrapper.text()).toEqual(expect.stringContaining("Snapshot won't work, as no target interactive is selected"));
  });
});
