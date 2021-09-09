import React from "react";
import { mount } from "enzyme";
import { UploadImage } from "./upload-image";
import { copyImageToS3, copyLocalImageToS3 } from "../../shared/utilities/copy-image-to-s3";
import { act } from "react-dom/test-utils";

jest.mock("../../shared/utilities/copy-image-to-s3", () => ({
  copyImageToS3: jest.fn(() => new Promise(resolve => setTimeout(() => resolve("http://snapshot/123"), 1))),
  copyLocalImageToS3: jest.fn(() => new Promise(resolve => setTimeout(() => resolve("http://snapshot/123"), 1))),
}));

const copyImageToS3Mock = copyImageToS3 as jest.Mock;
const copyLocalImageToS3Mock = copyLocalImageToS3 as jest.Mock;

const authoredState = {
  version: 1,
  questionType: "iframe_interactive" as const
};

describe("UploadBackground", () => {
  beforeEach(() => {
    copyImageToS3Mock.mockClear();
    copyLocalImageToS3Mock.mockClear();
  });

  it("renders upload button", () => {
    const setMock = jest.fn();
    const wrapper = mount(<UploadImage authoredState={authoredState} setInteractiveState={setMock} />);
    expect(wrapper.find("[data-test='upload-btn']").length).toEqual(1);
  });

  it("lets user upload local file", () => {
    const setMock = jest.fn();
    const wrapper = mount(<UploadImage authoredState={authoredState} setInteractiveState={setMock} />);
    wrapper.find("[data-test='upload-btn']").simulate("click");

    const fileInput = wrapper.find("input[type='file']");
    expect(fileInput.length).toEqual(1);

    const file = {
      name: "testfile.png",
    };
    act(() => {
      fileInput.simulate("change", { target: { files: [ file ] }});
    });
    expect(copyLocalImageToS3).toHaveBeenCalledWith(file);
    expect(copyImageToS3).not.toHaveBeenCalled();
  });

});