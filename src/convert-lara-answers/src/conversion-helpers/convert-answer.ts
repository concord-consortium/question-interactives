import { Timestamp } from "@google-cloud/firestore";
import { ConvertedAnswer, IManagedInteractiveQuestion, ILARAAnswerReportHash, ILARAAnonymousAnswerReportHash } from "../types";
import { isAnswerAnonymous } from "../utils";

export interface IConvertOptions {
  oldAnswer: ILARAAnswerReportHash | ILARAAnonymousAnswerReportHash;
  oldSourceKey: string;
  newSourceKey: string;
  newQuestion: IManagedInteractiveQuestion;
  typeSpecificProps: {
    type: string;
    question_type: string;
    answer: any;
    answer_text: string;
    report_state: any;
    // Used only by image question, see convert-image-question.ts for more details.
    legacy_answer_image_url?: string;
  },
  additionalMetadata?: any;
}

const deleteUndefinedValues = (object: any, level = 0) => {
  if (!object || level === 10) {
    // It should never happen in Firestore docs, but limit possible cycles.
    return;
  }
  Object.keys(object).forEach(key => {
    if (object[key] === undefined) {
      delete object[key];
    }
    if (typeof object[key] === "object") {
      deleteUndefinedValues(object[key], level + 1);
    }
  });
};

// Logic based on ActivityPlayer embeddable-utils.ts and firebase-db.ts code.
export const convertAnswer = (options: IConvertOptions): ConvertedAnswer => {
  const { newQuestion, oldAnswer, oldSourceKey, newSourceKey, typeSpecificProps, additionalMetadata } = options;

  const answer: ConvertedAnswer = {
    // Both LARA base question types and AP/LARA Managed Interactives share most of the properties. So, we can copy
    // all the attributes and overwrite / add ones that we need to. This initial step will cover fields like:
    // version, created, platform_id, platform_user_id, context_id, resource_link_id, resource_url, run_key,
    // remote_endpoint, shared_with, submitted and everything else that we could possibly miss if trying to copy manually.
    ...oldAnswer,
    // These attributes are specific to given question type.
    ...typeSpecificProps,

    ...additionalMetadata,

    version: 1,
    // Use deterministic ID, so each time the conversion script is ran, we update previously converted answer document.
    id: `converted-${oldSourceKey}-answers-${oldAnswer.id}`,
    // Question ID needs to be updated from the old type to a new one.
    question_id: newQuestion.id,

    convertedFrom: `${oldSourceKey}/answers/${oldAnswer.id}`,
    convertedAt: Timestamp.now(),

    source_key: newSourceKey,
    tool_id: newSourceKey,
  };

  if (isAnswerAnonymous(oldAnswer) && (answer as any).tool_user_id !== "anonymous") {
    // AP uses tool_user_id = "anonymous" while LARA seemed to use "". Update value to a newer version.
    (answer as any).tool_user_id = "anonymous";
  }

  deleteUndefinedValues(answer);

  return answer;
};
