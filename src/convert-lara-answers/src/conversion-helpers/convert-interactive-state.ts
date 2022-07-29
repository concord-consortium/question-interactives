import { convertAnswer } from "./convert-answer";
import { ILARAAnonymousAnswerReportHash, ILARAAnswerReportHash, IManagedInteractiveQuestion } from "../types";

export interface IConvertIntStateOptions {
  newQuestion: IManagedInteractiveQuestion;
  oldAnswer: ILARAAnswerReportHash | ILARAAnonymousAnswerReportHash;
  oldSourceKey: string;
  newSourceKey: string;
  additionalMetadata: any;
}

// There's no real conversion for interactive states. The only thing we need to do is to update sourceKey and toolId.
export const convertInteractiveState = (options: IConvertIntStateOptions) => {
  return convertAnswer({
    ...options,
    // It's a small TypeScript hack, but Interactive State has all the typeSpecificProps specified in the 'oldAnswer`
    // object already. It lets keep the typing in convert-answer.ts simpler and more readable. And that's where it
    // matters more, as it might catch the possible issues / missed props.
    typeSpecificProps: {} as any
  });
};
