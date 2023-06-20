import React from "react";
import { mount, render } from "enzyme";
import { Runtime } from "./runtime";
import { getInteractiveSnapshot, closeModal } from "@concord-consortium/lara-interactive-api";
import { TakeSnapshot } from "drawing-tool-interactive/src/components/take-snapshot";
import { UploadBackground } from "drawing-tool-interactive/src/components/upload-background";
// import { DrawingTool } from "drawing-tool-interactive/src/components/drawing-tool";
import Shutterbug  from "shutterbug";
import { DynamicTextTester } from "@concord-consortium/question-interactives-helpers/src/utilities/dynamic-text-tester";
import { useInitMessage } from "@concord-consortium/lara-interactive-api";
import { InitMessageContext } from "@concord-consortium/question-interactives-helpers/src/hooks/use-context-init-message";

jest.mock("@concord-consortium/lara-interactive-api", () => ({
  getInteractiveSnapshot: jest.fn(() => new Promise(resolve => resolve({success: true, snapshotUrl: "http://snapshot/123" }))),
  closeModal: jest.fn(),
  useDecorateContent: jest.fn(),
  getClient: jest.fn().mockReturnValue({
    addListener: jest.fn()
  }),
  useInitMessage: jest.fn(),
}));
const getInteractiveSnapshotMock = getInteractiveSnapshot as jest.Mock;
const closeModalMock = closeModal as jest.Mock;

jest.mock("shutterbug", () => ({
  snapshot: jest.fn((options: any) => options.done("https://mock-snapshot.com/123.png"))
}));
const ShutterbugSnapshotMock = Shutterbug.snapshot as jest.Mock;

let useCorsImageErrorResult = false;
jest.mock("@concord-consortium/question-interactives-helpers/src/hooks/use-cors-image-error-check", () => ({
  useCorsImageErrorCheck: () => useCorsImageErrorResult
}));


const useInitMessageMock = useInitMessage as jest.Mock;
const initMessage = {
  mode: "runtime" as const,
  linkedInteractives: [
    {
      id: "123-MwInteractive",
      label: "snapshotTarget"
    }
  ]
};
useInitMessageMock.mockReturnValue(initMessage);

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
    useCorsImageErrorResult = false;
  });

  it("renders rich text prompt, answer prompt and user answer", () => {
    const wrapper = mount(<DynamicTextTester><Runtime authoredState={authoredState} interactiveState={interactiveState} /></DynamicTextTester>);
    expect(wrapper.html()).toEqual(expect.stringContaining(authoredState.prompt));
    expect(wrapper.html()).toEqual(expect.stringContaining(authoredState.answerPrompt));
    expect(wrapper.text()).toEqual(expect.stringContaining(interactiveState.answerText));
  });

  it("renders snapshot UI when backgroundSource === snapshot", () => {
    const wrapperWithoutSnapshot = render(<DynamicTextTester><Runtime authoredState={authoredState} interactiveState={interactiveState} /></DynamicTextTester>);
    expect(wrapperWithoutSnapshot.html()).not.toContain("Take Snapshot");

    const authoredStateWithSnapshot = {...authoredState, backgroundSource: "snapshot" as const, snapshotTarget: "interactive_123"};
    const wrapper = mount(
      <InitMessageContext.Provider value={initMessage as any}>
        <DynamicTextTester>
          <Runtime authoredState={authoredStateWithSnapshot} interactiveState={interactiveState} />
        </DynamicTextTester>
      </InitMessageContext.Provider>
    );
    expect(wrapper.html()).toContain("Take Snapshot");
  });

  it("renders upload UI when backgroundSource === upload", () => {
    const wrapperWithoutUpload = mount(<DynamicTextTester><Runtime authoredState={authoredState} interactiveState={interactiveState} /></DynamicTextTester>);
    expect(wrapperWithoutUpload.find(UploadBackground).length).toEqual(0);

    const authoredStateWithSnapshot = {...authoredState, backgroundSource: "upload" as const};
    const wrapper = mount(<DynamicTextTester><Runtime authoredState={authoredStateWithSnapshot} interactiveState={interactiveState} /></DynamicTextTester>);
    expect(wrapper.find(UploadBackground).length).toEqual(1);
  });

  it("renders an error when authored background URL is not CORS enabled", () => {
    useCorsImageErrorResult = true;
    const wrapper = mount(<DynamicTextTester><Runtime authoredState={authoredState} /></DynamicTextTester>);
    expect(wrapper.html()).toEqual(expect.stringContaining("Authored background image is not CORS enabled"));
  });

  describe("dialog", () => {
    beforeEach(() => {
      (window as any).location = {
        href: "http://example.org/?drawingToolDialog"
      };
    });

    it("renders prompts, drawing tool and text area", () => {
      const wrapper = render(<DynamicTextTester><Runtime authoredState={authoredState} interactiveState={interactiveState} /></DynamicTextTester>);
      expect(wrapper.html()).toEqual(expect.stringContaining(authoredState.prompt));
      expect(wrapper.html()).toEqual(expect.stringContaining(authoredState.answerPrompt));
      expect(wrapper.html()).toEqual(expect.stringContaining("drawingTool"));
      expect(wrapper.find("textarea").length).toEqual(1);
    });

    // The following three tests now break due to having to change from shallow() to mount() in order
    // for the DynamicTextTester context to be added to provide a value for the DynamicText component.
    // When mount() is used the inner DrawingTool is mounted with causes this error to be thrown
    // from inside the drawing tool: `Error: Uncaught [TypeError: EventEmitter2 is not a constructor]`
    // Mocking `eventemitter2` in this test suite does not fix the issue and changing from shallow()
    // to render() so the innter DrawingTool is not rendered invalidates the test as we are not able
    // to then simulate the events as render() returns static html

    // BROKEN TEST AFTER DYNAMIC TEXT ADDED
    // it("calls setInteractiveState when user provides an answer", () => {
    //   const setState = jest.fn();
    //   const wrapper = mount(<DynamicTextTester><Runtime authoredState={authoredState} interactiveState={interactiveState} setInteractiveState={setState} /></DynamicTextTester>);
    //   wrapper.find("textarea").simulate("change", { target: { value: "new answer" } });
    //   const newState = setState.mock.calls[0][0](interactiveState);
    //   expect(newState).toEqual({answerType: "image_question_answer", drawingState: "", answerText: "new answer"});
    // });

    // BROKEN TEST AFTER DYNAMIC TEXT ADDED
    // it("renders a close button that closes the dialog and does NOT save annotated image PNG if there were no changes to drawing", () => {
    //   const setState = jest.fn();
    //   const wrapper = mount(<DynamicTextTester><Runtime authoredState={authoredState} interactiveState={interactiveState} setInteractiveState={setState} /></DynamicTextTester>);
    //   wrapper.find("[data-test='close-dialog-btn']").simulate("click");
    //   expect(closeModalMock).toHaveBeenCalled();
    //   expect(ShutterbugSnapshotMock).not.toHaveBeenCalled();
    // });

    // BROKEN TEST AFTER DYNAMIC TEXT ADDED
    // it("renders a close button that closes the dialog and saves annotated image PNG if there were changes to drawing", () => {
    //   const setState = jest.fn();
    //   const wrapper = mount(<DynamicTextTester><Runtime authoredState={authoredState} interactiveState={interactiveState} setInteractiveState={setState} /></DynamicTextTester>);
    //   wrapper.find(DrawingTool).prop("setInteractiveState")?.(() => ({...interactiveState, drawingState: "new drawing state!"}));
    //   wrapper.find("[data-test='close-dialog-btn']").simulate("click");
    //   expect(ShutterbugSnapshotMock).toHaveBeenCalled();
    //   expect(closeModalMock).toHaveBeenCalled();
    //   expect(setState).toHaveBeenCalled();
    //   // [1] => The second call done by Shutterbug! The first one was done above
    //   const newState = setState.mock.calls[1][0](interactiveState);
    //   expect(newState.answerImageUrl).toEqual("https://mock-snapshot.com/123.png");
    // });
  });

  describe("report mode", () => {
    it("renders rich text prompt, answer prompt and user answer", () => {
      const wrapper = mount(<DynamicTextTester><Runtime authoredState={authoredState} interactiveState={interactiveState} report={true} /></DynamicTextTester>);
      expect(wrapper.html()).toEqual(expect.stringContaining(authoredState.prompt));
      expect(wrapper.html()).toEqual(expect.stringContaining(authoredState.answerPrompt));
      expect(wrapper.text()).toEqual(expect.stringContaining(interactiveState.answerText));
    });

    it("doesn't render snapshot UI when backgroundSource === snapshot", () => {
      const authoredStateWithSnapshot = {...authoredState, backgroundSource: "snapshot" as const, snapshotTarget: "interactive_123"};
      const wrapper = mount(<DynamicTextTester><Runtime authoredState={authoredStateWithSnapshot} interactiveState={interactiveState} report={true} /></DynamicTextTester>);
      expect(wrapper.find(TakeSnapshot).length).toEqual(0);
    });

    it("doesn't render upload UI when backgroundSource === upload", () => {
      const authoredStateWithSnapshot = {...authoredState, backgroundSource: "upload" as const};
      const wrapper = mount(<DynamicTextTester><Runtime authoredState={authoredStateWithSnapshot} interactiveState={interactiveState} report={true} /></DynamicTextTester>);
      expect(wrapper.find(UploadBackground).length).toEqual(0);
    });
  });
});
