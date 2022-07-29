import { IInteractiveState as IImageQuestionInteractiveState } from "../../../image-question/components/types";
import { convertAnswer } from "./convert-answer";
import { ILARAAnonymousAnswerReportHash, ILARAAnswerReportHash, ILARAImageQuestionAnswerReportHash, IManagedInteractiveQuestion } from "../types";
import { getReportState } from "../utils";

export interface IConvertImageQuestionOptions {
  newQuestion: IManagedInteractiveQuestion;
  oldAnswer: (ILARAAnswerReportHash | ILARAAnonymousAnswerReportHash) & ILARAImageQuestionAnswerReportHash;
  oldSourceKey: string;
  newSourceKey: string;
  additionalMetadata: any;
}

// Logic based on ActivityPlayer embeddable-utils.ts and firebase-db.ts code.
export const convertImageQuestion = (options: IConvertImageQuestionOptions) => {
  const { newQuestion, oldAnswer } = options;

  const interactiveState: IImageQuestionInteractiveState = {
    answerType: "image_question_answer",
    answerImageUrl: oldAnswer.answer?.image_url,
    answerText: oldAnswer.answer?.text,
    submitted: !!oldAnswer.submitted,
  };

  const reportStateJSON = JSON.stringify(getReportState(newQuestion.authored_state, interactiveState, newQuestion.id));

  return convertAnswer({
    ...options,
    typeSpecificProps: {
      type: "image_question_answer",
      question_type: "image_question",
      answer: oldAnswer.answer,
      answer_text: oldAnswer.answer?.text,
      report_state: reportStateJSON,
      // Image question answers are tricky to convert. We might copy around image_url, but we don't have Drawing Tool
      // state. It means that the answer will work fine in the read mode, or reports, but once student tries to edit
      // it, they'll start from a blank state. This might lead to unintended data loss. Copy image_url to a new property
      // that will stay there forever and might help to recover the old answer if necessary.
      // See: https://concord-consortium.slack.com/archives/C0M5CM1RA/p1658512639621609
      legacy_answer_image_url: oldAnswer.answer?.image_url
    }
  });
};
