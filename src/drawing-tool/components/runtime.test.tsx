import React from "react";
import { shallow } from "enzyme";
import { Runtime } from "./runtime";
import { IAuthoredState, IInteractiveState } from "./types";
import { TakeSnapshot } from "./take-snapshot";
import { UploadBackground } from "./upload-background";

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
  it("renders rich text prompt", () => {
    const wrapper = shallow(<Runtime authoredState={authoredRichState} />);
    expect(wrapper.html()).toEqual(expect.stringContaining(authoredRichState.prompt));
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
});
