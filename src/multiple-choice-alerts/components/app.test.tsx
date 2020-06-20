/*
  This is a modified version of the standard multiple choice question which uses the LARA interactive
  API showModal() function to show feedback via modal alert rather than inline feedback. At this point
  its sole purpose is to allow manual testing of the modal alert functionality.
 */

import { baseAuthoringProps, IChoice } from "./app";

describe("preprocessFormData helper", () => {
  it("generates unique IDs for choices when they're missing", () => {
    const newData = baseAuthoringProps.preprocessFormData({
      version: 1,
      questionType: "multiple_choice",
      prompt: "Test prompt",
      hint: "Test instructions",
      choices: [
        {content: "A", correct: true} as IChoice,
        {content: "B", correct: true} as IChoice
      ],
      layout: "vertical",
    });
    const choices = newData.choices!;

    expect(choices[0].id).toBeDefined();
    expect(choices[1].id).toBeDefined();
    expect(choices[0].id).not.toEqual(choices[1].id);
  });

  it("doesn't overwrite existing choice IDs", () => {
    expect(baseAuthoringProps.preprocessFormData({
      version: 1,
      questionType: "multiple_choice",
      prompt: "Test prompt",
      hint: "Test instructions",
      choices: [
        {id: "1", content: "A", correct: true},
        {id: "2", content: "B", correct: true}
      ],
      layout: "vertical",
    })).toEqual({
      version: 1,
      questionType: "multiple_choice",
      prompt: "Test prompt",
      hint: "Test instructions",
      choices: [
        {id: "1", content: "A", correct: true},
        {id: "2", content: "B", correct: true}
      ],
      layout: "vertical",
    });
  });
});
