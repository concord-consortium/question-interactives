import React from "react";
import { shallow } from "enzyme";
import { Runtime } from "./runtime";
import { IAuthoredState, IInteractiveState } from "./app";
import { getInteractiveSnapshot } from "@concord-consortium/lara-interactive-api";
import { TakeSnapshot } from "../../drawing-tool/components/take-snapshot";
import { UploadBackground } from "../../drawing-tool/components/upload-background";
import { DrawingTool } from "../../drawing-tool/components/drawing-tool";

jest.mock("@concord-consortium/lara-interactive-api", () => ({
  getInteractiveSnapshot: jest.fn(() => new Promise(resolve => resolve({success: true, snapshotUrl: "http://snapshot/123" })))
}));
const getInteractiveSnapshotMock = getInteractiveSnapshot as jest.Mock;


const authoredState = {
  version: 1,
  questionType: "iframe_interactive" as const,
  prompt: "<p><strong>Rich</strong> <em>text</em> <u>prompt</u>",
  answerPrompt: "<p><strong>Rich</strong> <em>text</em> <u> answer prompt</u>",
  hint: "hint",
  required: false,
  defaultAnswer: "",
  imageFit: "center",
  imagePosition: "center",
  stampCollections: []
};

const interactiveState = {
  drawingState: "",
  answerType: "interactive_state" as const,
  answerText: "Test answer",
};

describe("Runtime", () => {
  beforeEach(() => {
    getInteractiveSnapshotMock.mockClear();
    delete (window as any).location;
    (window as any).location = {
      href: "http://example.org/"
    };
  });

  it("renders rich text prompt, answer prompt and user answer", () => {
    const wrapper = shallow(<Runtime authoredState={authoredState} interactiveState={interactiveState} />);
    expect(wrapper.html()).toEqual(expect.stringContaining(authoredState.prompt));
    expect(wrapper.html()).toEqual(expect.stringContaining(authoredState.answerPrompt));
    expect(wrapper.text()).toEqual(expect.stringContaining(interactiveState.answerText));
  });

  it("renders snapshot UI when backgroundSource === snapshot", () => {
    const wrapperWithoutSnapshot = shallow(<Runtime authoredState={authoredState} interactiveState={interactiveState} />);
    expect(wrapperWithoutSnapshot.find(TakeSnapshot).length).toEqual(0);

    const authoredStateWithSnapshot = {...authoredState, backgroundSource: "snapshot" as const, snapshotTarget: "interactive_123"};
    const wrapper = shallow(<Runtime authoredState={authoredStateWithSnapshot} interactiveState={interactiveState} />);
    expect(wrapper.find(TakeSnapshot).length).toEqual(1);
  });

  it("renders upload UI when backgroundSource === upload", () => {
    const wrapperWithoutUpload = shallow(<Runtime authoredState={authoredState} interactiveState={interactiveState} />);
    expect(wrapperWithoutUpload.find(UploadBackground).length).toEqual(0);

    const authoredStateWithSnapshot = {...authoredState, backgroundSource: "upload" as const};
    const wrapper = shallow(<Runtime authoredState={authoredStateWithSnapshot} interactiveState={interactiveState} />);
    expect(wrapper.find(UploadBackground).length).toEqual(1);
  });

  describe("dialog", () => {
    beforeEach(() => {
      (window as any).location = {
        href: "http://example.org/?drawingToolDialog"
      };
    });

    it("renders prompts, drawing tool and text area", () => {
      const wrapper = shallow(<Runtime authoredState={authoredState} interactiveState={interactiveState} />);
      expect(wrapper.html()).toEqual(expect.stringContaining(authoredState.prompt));
      expect(wrapper.html()).toEqual(expect.stringContaining(authoredState.answerPrompt));
      expect(wrapper.find(DrawingTool).length).toEqual(1);
      expect(wrapper.find("textarea").length).toEqual(1);
    });

    it("calls setInteractiveState when user provides an answer", () => {
      const setState = jest.fn();
      const wrapper = shallow(<Runtime authoredState={authoredState} interactiveState={interactiveState} setInteractiveState={setState} />);
      wrapper.find("textarea").simulate("change", { target: { value: "new answer" } });
      const newState = setState.mock.calls[0][0](interactiveState);
      expect(newState).toEqual({answerType: "interactive_state", drawingState: "", answerText: "new answer"});
    });
  });

  describe("report mode", () => {
    it("renders rich text prompt, answer prompt and user answer", () => {
      const wrapper = shallow(<Runtime authoredState={authoredState} interactiveState={interactiveState} report={true} />);
      expect(wrapper.html()).toEqual(expect.stringContaining(authoredState.prompt));
      expect(wrapper.html()).toEqual(expect.stringContaining(authoredState.answerPrompt));
      expect(wrapper.text()).toEqual(expect.stringContaining(interactiveState.answerText));
    });

    it("doesn't render snapshot UI when backgroundSource === snapshot", () => {
      const authoredStateWithSnapshot = {...authoredState, backgroundSource: "snapshot" as const, snapshotTarget: "interactive_123"};
      const wrapper = shallow(<Runtime authoredState={authoredStateWithSnapshot} interactiveState={interactiveState} report={true} />);
      expect(wrapper.find(TakeSnapshot).length).toEqual(0);
    });

    it("doesn't render upload UI when backgroundSource === upload", () => {
      const authoredStateWithSnapshot = {...authoredState, backgroundSource: "upload" as const};
      const wrapper = shallow(<Runtime authoredState={authoredStateWithSnapshot} interactiveState={interactiveState} report={true} />);
      expect(wrapper.find(UploadBackground).length).toEqual(0);
    });
  });
});
