import { IAuthoredState, IInteractiveState } from "./components/types";

export const getValidScoreMapping = (authoredState: IAuthoredState) => {
  const { scoreMapping } = authoredState;
  if (!scoreMapping) {
    return null;
  }
  if ([0, 1, 2, 3, 4, 5, 6].every(idx => scoreMapping[idx])) {
    // All 7 elements of score mapping are defined (from 0 to 6).
    return scoreMapping;
  }
  if ([0, 1, 2, 3, 4].every(idx => scoreMapping[idx]) && [5, 6].every(idx => !scoreMapping[idx])) {
    // 0-4 elements of score mapping are defined, and 5-6 elements are undefined / empty.
    return scoreMapping.slice(0, 5);
  }
  // Do not allow any other combinations, as it's not supported by the ScoreBOT scale and ML model.
  return null;
};

export const getMaxScore = (authoredState: IAuthoredState) => {
  const validScoreMapping = getValidScoreMapping(authoredState);
  if (validScoreMapping) {
    return validScoreMapping.length - 1;
  }
  return null;
};

export const getNumberOfAttempts = (interactiveState?: IInteractiveState) => {
  return interactiveState?.attempts ? interactiveState.attempts.length : null;
};

export const getLastScore = (interactiveState?: IInteractiveState | null) => {
  if (!interactiveState?.attempts || interactiveState.attempts.length === 0) {
    return null;
  }
  return interactiveState.attempts[interactiveState.attempts.length - 1].score;
};

export const getLastFeedback = (authoredState: IAuthoredState, interactiveState?: IInteractiveState | null) => {
  const score = getLastScore(interactiveState);
  const scoreMapping = getValidScoreMapping(authoredState);
  if (score !== null && scoreMapping !== null) {
    return scoreMapping[score];
  }
  return null;
};

export const getLastAttemptAnswerText = (interactiveState?: IInteractiveState | null) => {
  if (!interactiveState?.attempts || interactiveState.attempts.length === 0) {
    return null;
  }
  return interactiveState.attempts[interactiveState.attempts.length - 1].answerText;
};


export const isFeedbackOutdated = (interactiveState?: IInteractiveState | null) => {
  if (!interactiveState?.attempts || interactiveState.attempts.length === 0) {
    return true;
  }
  return interactiveState.attempts[interactiveState.attempts.length - 1].answerText !== interactiveState.answerText;
};
