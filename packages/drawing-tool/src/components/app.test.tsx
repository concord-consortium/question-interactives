import { FormValidation } from "@rjsf/utils";
import { baseAuthoringProps } from "./app";

describe("validation helper", () => {
  it("adds error when background URL is incorrect", () => {
    const errors = {
      backgroundImageUrl: {
        addError: jest.fn()
      }
    } as unknown as FormValidation;
    baseAuthoringProps.validate({ version: 1, backgroundSource: "url", backgroundImageUrl: "https://aws.concord.org/img/123.png" }, errors);
    expect(errors.backgroundImageUrl?.addError).not.toHaveBeenCalled();

    baseAuthoringProps.validate({ version: 1, backgroundSource: "url", backgroundImageUrl: "https://token-service-files.concordqa.org/img/123.png" }, errors);
    expect(errors.backgroundImageUrl?.addError).not.toHaveBeenCalled();

    baseAuthoringProps.validate({ version: 1, backgroundSource: "url", backgroundImageUrl: "https://token-service-files.s3.amazonaws.com/img/123.png" }, errors);
    expect(errors.backgroundImageUrl?.addError).not.toHaveBeenCalled();

    baseAuthoringProps.validate({ version: 1, backgroundSource: "upload", backgroundImageUrl: "malformed URL" }, errors);
    expect(errors.backgroundImageUrl?.addError).not.toHaveBeenCalled(); // don't validate backgroundImageUrl when it's not used (bgSource = upload)

    baseAuthoringProps.validate({ version: 1, backgroundSource: "url", backgroundImageUrl: "aws.example.com/img/123.png" }, errors);
    expect(errors.backgroundImageUrl?.addError).toHaveBeenCalledWith("Invalid background image URL."); // missing protocol

    baseAuthoringProps.validate({ version: 1, backgroundSource: "url", backgroundImageUrl: "https://aws.example.com/img/123.png" }, errors);
    expect(errors.backgroundImageUrl?.addError).toHaveBeenCalledWith("Please use only uploaded images or images hosted at *.concord.org.");
  });
});
