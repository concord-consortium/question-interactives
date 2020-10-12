import { IAuthoredState, IInteractiveState } from "./app";

export type IGenericAuthoredState = Omit<IAuthoredState, "questionType"> & { questionType: "image_question" | "iframe_interactive"};
export type IGenericInteractiveState = Omit<IInteractiveState, "answerType"> & { answerType: "image_question_answer" | "interactive_state" };

