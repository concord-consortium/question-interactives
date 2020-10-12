import React from "react";
import { shallow } from "enzyme";
import { Runtime } from "./runtime";
import { getInteractiveSnapshot, closeModal } from "@concord-consortium/lara-interactive-api";
import { TakeSnapshot } from "../../drawing-tool/components/take-snapshot";
import { UploadBackground } from "../../drawing-tool/components/upload-background";
import { DrawingTool } from "../../drawing-tool/components/drawing-tool";
import Shutterbug  from "shutterbug";

jest.mock("@concord-consortium/lara-interactive-api", () => ({
  getInteractiveSnapshot: jest.fn(() => new Promise(resolve => resolve({success: true, snapshotUrl: "http://snapshot/123" }))),
  closeModal: jest.fn()
}));
const getInteractiveSnapshotMock = getInteractiveSnapshot as jest.Mock;
const closeModalMock = closeModal as jest.Mock;

jest.mock("shutterbug", () => ({
  snapshot: jest.fn((options: any) => options.done("https://mock-snapshot.com/123.png"))
}));
const ShutterbugSnapshotMock = Shutterbug.snapshot as jest.Mock;


const authoredState = {
  version: 1,
  questionType: "image_question" as const,
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
  answerType: "image_question_answer" as const,
  answerText: "Test answer",
};

describe("Runtime", () => {
  beforeEach(() => {
    getInteractiveSnapshotMock.mockClear();
    closeModalMock.mockClear();
    ShutterbugSnapshotMock.mockClear();
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
      expect(newState).toEqual({answerType: "image_question_answer", drawingState: "", answerText: "new answer"});
    });

    it("renders a close button that closes the dialog and does NOT save annotated image PNG if there were no changes to drawing", () => {
      const setState = jest.fn();
      const wrapper = shallow(<Runtime authoredState={authoredState} interactiveState={interactiveState} setInteractiveState={setState} />);
      wrapper.find("[data-test='close-dialog-btn']").simulate("click");
      expect(closeModalMock).toHaveBeenCalled();
      expect(ShutterbugSnapshotMock).not.toHaveBeenCalled();
    });

    it("renders a close button that closes the dialog and saves annotated image PNG if there were changes to drawing", () => {
      const setState = jest.fn();
      const wrapper = shallow(<Runtime authoredState={authoredState} interactiveState={interactiveState} setInteractiveState={setState} />);
      const newInteractiveState = {...interactiveState, drawingState: "new drawing state!"}; // this will trigger saving of the annotated image PNG
      wrapper.setProps({ authoredState, setInteractiveState: setState, interactiveState: newInteractiveState });
      wrapper.find("[data-test='close-dialog-btn']").simulate("click");
      expect(ShutterbugSnapshotMock).toHaveBeenCalled();
      expect(closeModalMock).toHaveBeenCalled();
      expect(setState).toHaveBeenCalled();
      const newState = setState.mock.calls[0][0](interactiveState);
      expect(newState.answerImageUrl).toEqual("https://mock-snapshot.com/123.png");
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
