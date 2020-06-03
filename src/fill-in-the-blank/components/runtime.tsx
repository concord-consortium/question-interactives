import React from "react";
import { IAuthoredState, IBlankDef, IInteractiveState, IFilledBlank } from "./app";
import css from "./runtime.scss";

interface IProps {
  authoredState: IAuthoredState;
  interactiveState?: IInteractiveState | null;
  setInteractiveState?: (state: IInteractiveState) => void;
  report?: boolean;
  setNavigation?: (enableForwardNav: boolean, message: string) => void;
}

export const insertInputs = (prompt: string, blanks: IBlankDef[], userResponses: IFilledBlank[]) => {
  if (blanks.length === 0) {
    // Stop condition. No more blanks to test, return the current prompt.
    return [ prompt ];
  }
  const blank = blanks[0];
  const remainingBlanks = blanks.slice(1);

  const result: (string | {id: string, value?: string, size?: number, matchTerm?: string})[] = [];
  const dividedPrompt = prompt.split(blank.id);
  if (dividedPrompt.length === 1) {
    // Blank not found in this prompt part. Try other blanks.
    result.push(...insertInputs(prompt, remainingBlanks, userResponses));
  }
  if (dividedPrompt.length === 2) {
    // Blank found in this prompt part.
    result.push(...insertInputs(dividedPrompt[0], remainingBlanks, userResponses));
    const response = userResponses.find(ur => ur.id === blank.id)?.response || "";
    result.push({id: blank.id, value: response, size: blank.size, matchTerm: blank.matchTerm });
    result.push(...insertInputs(dividedPrompt[1], remainingBlanks, userResponses));
  }
  if (dividedPrompt.length > 2) {
    // Multiple blanks with the same ID found, incorrect state.
    throw new Error("Invalid authored state: multiple blanks with the same ID.");
  }
  return result;
};

export const Runtime: React.FC<IProps> = ({ authoredState, interactiveState, setInteractiveState, report }) => {

  const handleChange = (blankId: string, event: React.ChangeEvent<HTMLInputElement>) => {
    const newState = Object.assign({}, interactiveState, { blanks: interactiveState?.blanks?.slice() || [] });
    const newResponse = {id: blankId, response: event.target.value };
    const existingResponse = newState.blanks.find(b => b.id === blankId);
    if (existingResponse) {
      const idx = newState.blanks.indexOf(existingResponse);
      newState.blanks.splice(idx, 1, newResponse);
    } else {
      newState.blanks.push(newResponse);
    }
    setInteractiveState?.(newState);
  };

  const getInputClass = (value?: string, matchTerm?: string) => {
    if (!report || !matchTerm) {
      return undefined;
    }
    return value === matchTerm ? css.correctAnswer : css.incorrectAnswer;
  }

  let content = [];
  try {
    content = insertInputs(authoredState.prompt || "", authoredState.blanks || [], interactiveState?.blanks || []);
  } catch (e) {
    return e.message;
  }

  const readOnly = report || (authoredState.required && interactiveState?.submitted);

  return (
    <div>
      {
        content.map(element => {
          if (typeof element === "string") {
            return element;
          } else {
            return <input
              className={getInputClass(element.value, element.matchTerm)}
              type="text"
              key={element.id}
              value={element.value}
              size={element.size}
              onChange={readOnly ? undefined : handleChange.bind(null, element.id)}
              readOnly={readOnly}
              disabled={readOnly}
            />
          }
        })
      }
    </div>
  );
};
