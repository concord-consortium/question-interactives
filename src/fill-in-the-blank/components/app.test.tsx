import React from "react";
import { baseAuthoringProps } from "./app";
import { defaultBlankSize } from "./types";
import { FormValidation } from "react-jsonschema-form";

describe("preprocessFormData helper", () => {
  it("handles missing props", () => {
    expect(baseAuthoringProps.preprocessFormData({
      version: 1,
      questionType: "iframe_interactive"
    })).toEqual({
      version: 1,
      questionType: "iframe_interactive",
      blanks: []
    });
  });

  it("generates missing blank options", () => {
    expect(baseAuthoringProps.preprocessFormData({
      version: 1,
      questionType: "iframe_interactive",
      prompt: "New prompt with [blank-1] and [blank-2]",
      hint: "Test instructions",
      blanks: [
        {id: "[blank-1]", size: 10}
      ]
    })).toEqual({
      version: 1,
      questionType: "iframe_interactive",
      prompt: "New prompt with [blank-1] and [blank-2]",
      hint: "Test instructions",
      blanks: [
        {id: "[blank-1]", size: 10},
        {id: "[blank-2]", size: defaultBlankSize}
      ]
    });
  });

  it("removes extraneous blank options", () => {
    expect(baseAuthoringProps.preprocessFormData({
      version: 1,
      questionType: "iframe_interactive",
      prompt: "New prompt with only [blank-1]",
      hint: "Test instructions",
      blanks: [
        {id: "[blank-1]", size: 10},
        {id: "[blank-2]", size: defaultBlankSize}
      ]
    })).toEqual({
      version: 1,
      questionType: "iframe_interactive",
      prompt: "New prompt with only [blank-1]",
      hint: "Test instructions",
      blanks: [
        {id: "[blank-1]", size: 10}
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
    baseAuthoringProps.validate({ version: 1, questionType: "iframe_interactive", prompt: "test [blank-1], [blank-2], and [blank-3]"}, errors);
    expect(errors.prompt.addError).not.toHaveBeenCalled();

    baseAuthoringProps.validate({ version: 1, questionType: "iframe_interactive", prompt: "test [blank-1], [blank-2], and [blank-1]"}, errors);
    expect(errors.prompt.addError).toHaveBeenCalledWith("The same blank ID used multiple times: [blank-1]");
  })
});
