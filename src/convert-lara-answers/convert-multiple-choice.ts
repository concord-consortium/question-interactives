import { IInteractiveState as IMultipleChoiceInteractiveState } from "../multiple-choice/components/types";
import { convertAnswer } from "./convert-answer";
import { ILARAAnonymousAnswerReportHash, ILARAAnswerReportHash, ILARAMultipleChoiceAnswerReportHash, IManagedInteractiveQuestion } from "./types";
import { getReportState } from "./utils";
import { getAnswerText } from "../multiple-choice/components/utils";

export interface IConvertMultipleChoiceOptions {
  newQuestion: IManagedInteractiveQuestion;
  oldAnswer: (ILARAAnswerReportHash | ILARAAnonymousAnswerReportHash) & ILARAMultipleChoiceAnswerReportHash;
  oldSourceKey: string;
  newSourceKey: string;
  additionalMetadata: any;
}

// Logic based on ActivityPlayer embeddable-utils.ts and firebase-db.ts code.
export const convertMultipleChoice = (options: IConvertMultipleChoiceOptions) => {
  const { newQuestion, oldAnswer } = options;

  const authoredState = typeof newQuestion.authored_state === "string" ? JSON.parse(newQuestion.authored_state) : newQuestion.authored_state;
  // Note that this assumes 1:1 mapping between old LARA MC choice ID and new MC Managed Interactive choice ID.
  // See: https://concord-consortium.slack.com/archives/C0M5CM1RA/p1658496476752829
  const choiceIds = oldAnswer.answer?.choice_ids.map(choice => choice.toString()) || [];
  const answerText = getAnswerText(choiceIds, authoredState);

  const interactiveState: IMultipleChoiceInteractiveState = {
    answerType: "multiple_choice_answer",
    selectedChoiceIds: choiceIds,
    answerText,
    submitted: !!oldAnswer.submitted,
  };

  const reportStateJSON = JSON.stringify(getReportState(newQuestion.authored_state, interactiveState, newQuestion.id));

  return convertAnswer({
    ...options,
    typeSpecificProps: {
      type: "multiple_choice_answer",
      question_type: "multiple_choice",
      answer: {
        choice_ids: choiceIds
      },
      answer_text: answerText,
      report_state: reportStateJSON
    }
  });
};
