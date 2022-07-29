import { convertImageQuestion, IConvertImageQuestionOptions } from "./conversion-helpers/convert-image-question";
import { convertInteractiveState, IConvertIntStateOptions } from "./conversion-helpers/convert-interactive-state";
import { convertMultipleChoice, IConvertMultipleChoiceOptions } from "./conversion-helpers/convert-multiple-choice";
import { convertOpenResponse, IConvertOpenResponseOptions } from "./conversion-helpers/convert-open-response";
import { IReportState, AnswerType } from "./types";

type IConvertOptions = IConvertOpenResponseOptions | IConvertMultipleChoiceOptions | IConvertImageQuestionOptions | IConvertIntStateOptions;

const conversionFunc: Record<AnswerType, any> = {
  interactive_state: convertInteractiveState,
  open_response: convertOpenResponse,
  multiple_choice: convertMultipleChoice,
  image_question: convertImageQuestion,
  labbook: () => null
};

export const convertAnswer = (questionType: AnswerType, options: IConvertOptions) => conversionFunc[questionType](options);

export const getAnswerType = (answerFirestoreData: any): AnswerType | null => {
  // Note that ID is the most reliable way to get the question type. As interactive_run_state might often set
  // other question types in the `question_type` property, eg `open_response` when Managed Interactive "pretends"
  // to be a open response question.
  if (answerFirestoreData.id.startsWith("open_response")) {
    return "open_response";
  }
  if (answerFirestoreData.id.startsWith("multiple_choice")) {
    return "multiple_choice";
  }
  if (answerFirestoreData.id.startsWith("image_question")) {
    return "image_question";
  }
  if (answerFirestoreData.id.startsWith("interactive_run_state")) {
    return "interactive_state";
  }
  if (answerFirestoreData.id.startsWith("labbook")) {
    return "labbook";
  }
  return null;
};

// questionRefId format: "managed_interactive_404"
// Based on ActivityPlayer embeddable-utils.ts.
export const getReportState = (authoredState: any, interactiveState: any, questionRefId: string): IReportState => ({
  mode: "report",
  authoredState: (typeof authoredState === "string" ? authoredState : JSON.stringify(authoredState)) || "",
  interactiveState: JSON.stringify(interactiveState),
  interactive: {
    id: questionRefId, // eg "managed_interactive_404"
    name: "",
  },
  version: 1
});

// "404-ManagedInteractive" => "managed_interactive_404"
// Based on ActivityPlayer embeddable-utils.ts
export const refIdToAnswersQuestionId = (refId: string) => {
  const refIdRegEx = /(\d*)-(\D*)/g;
  const parsed = refIdRegEx.exec(refId);
  if (parsed?.length) {
    const [ , embeddableId, embeddableType] = parsed;
    const snakeCased = embeddableType.replace(/(?!^)([A-Z])/g, "_$1").toLowerCase();
    return `${snakeCased}_${embeddableId}`;
  }
  return refId;
};

export const isAnswerAnonymous = (laraAnswer: any) => !laraAnswer.platform_id || !laraAnswer.remote_endpoint;
