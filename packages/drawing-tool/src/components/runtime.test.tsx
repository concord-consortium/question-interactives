import React from "react";
import { mount, render } from "enzyme";
import { Runtime } from "./runtime";
import { IAuthoredState, IInteractiveState } from "./types";
import { TakeSnapshot } from "./take-snapshot";
import { UploadBackground } from "./upload-background";
import { DynamicTextTester } from "@concord-consortium/question-interactives-helpers/src/utilities/dynamic-text-tester";
import { InitMessageContext } from "@concord-consortium/question-interactives-helpers/src/hooks/use-context-init-message";
import { useInitMessage } from "@concord-consortium/lara-interactive-api";

jest.mock("@concord-consortium/lara-interactive-api", () => ({
  getInteractiveSnapshot: jest.fn(() => new Promise(resolve => resolve({success: true, snapshotUrl: "http://snapshot/123" }))),
  useInitMessage: jest.fn(),
  getClient: jest.fn().mockReturnValue({
    addListener: jest.fn()
  }),
  useDecorateContent: jest.fn()
}));


let useCorsImageErrorResult = false;
jest.mock("@concord-consortium/question-interactives-helpers/src/hooks/use-cors-image-error-check", () => ({
  useCorsImageErrorCheck: () => useCorsImageErrorResult
}));

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

const authoredRichState = {
  ...authoredState,
  prompt: "<p><strong>Rich</strong> <em>text</em> <u>prompt</u>"
};

const interactiveState: IInteractiveState = {
  drawingState: "",
  answerType: "interactive_state" as const,
};

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

describe("Runtime", () => {
  beforeEach(() => {
    useCorsImageErrorResult = false;
  });

  it("renders rich text prompt", () => {
     const wrapper = render(<DynamicTextTester><Runtime authoredState={authoredRichState} /></DynamicTextTester>);
     expect(wrapper.html()).toEqual(expect.stringContaining(authoredRichState.prompt));
  });

   it("renders snapshot UI when backgroundSource === snapshot", () => {
     const wrapperWithoutSnapshot = render(<DynamicTextTester><Runtime authoredState={authoredState} interactiveState={interactiveState} /></DynamicTextTester>);
     expect(wrapperWithoutSnapshot.html()).not.toContain("Take Snapshot");

     const authoredStateWithSnapshot = {...authoredState, backgroundSource: "snapshot" as const, snapshotTarget: "interactive_123"};
     const wrapper = render(
        <InitMessageContext.Provider value={initMessage as any}>
          <DynamicTextTester>
            <Runtime authoredState={authoredStateWithSnapshot} interactiveState={interactiveState} />
          </DynamicTextTester>
        </InitMessageContext.Provider>
      );
     expect(wrapper.html()).toContain("Take Snapshot");
   });

   it("renders upload UI when backgroundSource === upload", () => {
     const wrapperWithoutUpload = render(<DynamicTextTester><Runtime authoredState={authoredState} interactiveState={interactiveState} /></DynamicTextTester>);
     expect(wrapperWithoutUpload.html()).not.toContain("Upload Image");

     const authoredStateWithSnapshot = {...authoredState, backgroundSource: "upload" as const};
     const wrapper = render(<DynamicTextTester><Runtime authoredState={authoredStateWithSnapshot} interactiveState={interactiveState} /></DynamicTextTester>);
     expect(wrapper.html()).toContain("Upload Image");
   });

  it("renders an error when authored background URL is not CORS enabled", () => {
    useCorsImageErrorResult = true;
    const wrapper = mount(<DynamicTextTester><Runtime authoredState={authoredRichState} /></DynamicTextTester>);
    expect(wrapper.html()).toEqual(expect.stringContaining("Authored background image is not CORS enabled"));
  });
});
