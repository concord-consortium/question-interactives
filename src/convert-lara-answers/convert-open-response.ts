import { IInteractiveState as IOpenResponseInteractiveState } from "../open-response/components/types";
import { convertAnswer } from "./convert-answer";
import { ILARAAnonymousAnswerReportHash, ILARAAnswerReportHash, ILARAOpenResponseAnswerReportHash, IManagedInteractiveQuestion } from "./types";
import { getReportState } from "./utils";

export interface IConvertOpenResponseOptions {
  newQuestion: IManagedInteractiveQuestion;
  oldAnswer: (ILARAAnswerReportHash | ILARAAnonymousAnswerReportHash) & ILARAOpenResponseAnswerReportHash;
  oldSourceKey: string;
  newSourceKey: string;
  additionalMetadata: any;
}

// Logic based on ActivityPlayer embeddable-utils.ts and firebase-db.ts code.
export const convertOpenResponse = (options: IConvertOpenResponseOptions) => {
  const { newQuestion, oldAnswer } = options;

  const interactiveState: IOpenResponseInteractiveState = {
    answerType: "open_response_answer",
    answerText: oldAnswer.answer,
    submitted: !!oldAnswer.submitted,
    // `audioFile` can be ignored, as LARA OR doesn't let users record audio responses.
  };

  const reportStateJSON = JSON.stringify(getReportState(newQuestion.authored_state, interactiveState, newQuestion.id));

  return convertAnswer({
    ...options,
    typeSpecificProps: {
      type: "open_response_answer",
      question_type: "open_response",
      answer: oldAnswer.answer,
      answer_text: oldAnswer.answer,
      report_state: reportStateJSON
    }
  });
};
