import { IAuthoredState } from "./types";

export const getAnswerText = (choiceIds: string[], authoredState: IAuthoredState) => {
  return choiceIds.map(choiceId => {
    const choice = authoredState.choices.find(c => c.id === choiceId);
    if (!choice) {
      return "";
    }
    return choice.correct ? `(correct) ${choice.content}` : choice.content;
  }).join(", ");
};
