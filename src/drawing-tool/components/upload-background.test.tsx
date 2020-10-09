import React from "react";
import { mount } from "enzyme";
import { UploadBackground } from "./upload-background";
import { copyImageToS3, copyLocalImageToS3 } from "../../shared/utilities/copy-image-to-s3";
import { act } from "react-dom/test-utils";

jest.mock("../../shared/utilities/copy-image-to-s3", () => ({
  copyImageToS3: jest.fn(() => new Promise(resolve => setTimeout(() => resolve("http://snapshot/123"), 1))),
  copyLocalImageToS3: jest.fn(() => new Promise(resolve => setTimeout(() => resolve("http://snapshot/123"), 1))),
}));

const copyImageToS3Mock = copyImageToS3 as jest.Mock;
const copyLocalImageToS3Mock = copyLocalImageToS3 as jest.Mock;


describe("UploadBackground", () => {
  beforeEach(() => {
    copyImageToS3Mock.mockClear();
    copyLocalImageToS3Mock.mockClear();
  });

  it("renders upload button", () => {
    const setMock = jest.fn();
    const wrapper = mount(<UploadBackground setInteractiveState={setMock} />);

    expect(wrapper.find("[data-test='upload-btn']").length).toEqual(1);
    wrapper.find("[data-test='upload-btn']").simulate("click");
    expect(wrapper.find("[data-test='upload-btn']").length).toEqual(0);
  });

  it("lets user upload local file", () => {
    const setMock = jest.fn();
    const wrapper = mount(<UploadBackground setInteractiveState={setMock} />);
    wrapper.find("[data-test='upload-btn']").simulate("click");
    expect(wrapper.find("[data-test='upload-btn']").length).toEqual(0);

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

  it("lets user upload image by dropping external URL", () => {
    const setMock = jest.fn();
    const wrapper = mount(<UploadBackground setInteractiveState={setMock} />);

    expect(wrapper.find("[data-test='upload-btn']").length).toEqual(1);
    wrapper.find("[data-test='upload-btn']").simulate("click");

    expect(wrapper.find("[data-test='upload-btn']").length).toEqual(0);

    const dropArea = wrapper.find("[data-test='drop-area']");
    expect(dropArea.length).toEqual(1);

    const url = "http://image.png";
    act(() => {
      dropArea.simulate("drop", { dataTransfer: { files: [ url ] }});
    });
    expect(copyImageToS3).toHaveBeenCalledWith(url);
    expect(copyLocalImageToS3).not.toHaveBeenCalled();
  });
});
