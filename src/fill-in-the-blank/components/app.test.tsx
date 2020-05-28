import React from "react";
import { baseAuthoringProps, defaultBlankSize } from "./app";
import { FormValidation } from "react-jsonschema-form";

describe("preprocessFormData helper", () => {
  it("generates missing blank options", () => {
    expect(baseAuthoringProps.preprocessFormData({
      version: 1,
      prompt: "New prompt with [blank-1] and [blank-2]",
      hint: "Test instructions",
      blanks: [
        {id: "[blank-1]", size: 10}
      ]
    })).toEqual({
      version: 1,
      prompt: "New prompt with [blank-1] and [blank-2]",
      hint: "Test instructions",
      blanks: [
        {id: "[blank-1]", size: 10},
        {id: "[blank-2]", size: defaultBlankSize}
      ]
    });
  });
});

describe("validation helper", () => {
  it("adds error when there are two blanks with the same ID", () => {
    const errors = {
      prompt: {
        addError: jest.fn()
      }
    } as unknown as FormValidation;
    baseAuthoringProps.validate({ version: 1, prompt: "test [blank-1], [blank-2], and [blank-3]"}, errors);
    expect(errors.prompt.addError).not.toHaveBeenCalled();

    baseAuthoringProps.validate({ version: 1, prompt: "test [blank-1], [blank-2], and [blank-1]"}, errors);
    expect(errors.prompt.addError).toHaveBeenCalledWith("The same blank ID used multiple times: [blank-1]");
  })
});
