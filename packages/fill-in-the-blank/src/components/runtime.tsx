import React, { useCallback } from "react";
import striptags from "striptags";
import { IRuntimeQuestionComponentProps } from "@concord-consortium/question-interactives-helpers/src/components/base-question-app";
import { ParseHTMLReplacer, renderHTML } from "@concord-consortium/question-interactives-helpers/src/utilities/render-html";
import { DecorateChildren } from "@concord-consortium/text-decorator";
import { useGlossaryDecoration } from "@concord-consortium/question-interactives-helpers/src/hooks/use-glossary-decoration";
import { DynamicText } from "@concord-consortium/dynamic-text";

import { blankRegexp, defaultBlankSize, IAuthoredState, IBlankDef, IFilledBlank, IInteractiveState } from "./types";

import css from "./runtime.scss";

interface IProps extends IRuntimeQuestionComponentProps<IAuthoredState, IInteractiveState> {
  setNavigation?: (enableForwardNav: boolean, message: string) => void;
}

const getInputClass = (report?: boolean, value?: string, matchTerm?: string) => {
  if (!report || !matchTerm) return undefined;
  return value === matchTerm ? css.correctAnswer : css.incorrectAnswer;
};

const getBlankInfo = (blankId: string, blanks: IBlankDef[], userResponses: IFilledBlank[]) => {
  return {
    authorInfo: blanks.find(blank => blank.id === blankId),
    userInfo: userResponses.find(blank => blank.id === blankId)
  };
};

interface IReplaceBlanksWithValues {
  prompt: string;
  blanks: IBlankDef[];
  responses: IFilledBlank[];
}
export const replaceBlanksWithValues = (args: IReplaceBlanksWithValues) => {
  const { prompt, blanks, responses } = args;
  return prompt.replace(blankRegexp, blankId => {
    const { userInfo } = getBlankInfo(blankId, blanks, responses);
    return `[ ${userInfo?.response || ""} ]`;
  });
};

export const replaceBlanksWithInputs = (prompt: string) => {
  return prompt.replace(blankRegexp, blankId => `<input id="${blankId}"/>`);
};

const blankWord = "blank";

// The id of the visually-hidden element that supplies the full prompt text as
// an accessible description shared by every blank input (see getPromptContextDescription).
export const blankContextId = "fill-in-the-blank-prompt-context";

// Plain-text version of the prompt suitable for a screen reader: HTML removed
// and each blank token read aloud as the word "blank".
export const getBlankLabelContext = (prompt: string) =>
  striptags(prompt)
    .replace(blankRegexp, blankWord)
    .replace(/\s+/g, " ")
    .trim();

// Concise accessible name for the input that fills `blankId`: just its position.
// The surrounding prose supplies context when read linearly (browse mode), so
// the name stays short to avoid duplicating that text on every field.
export const getBlankAriaLabel = (prompt: string, blankId: string) => {
  const orderedIds: string[] = prompt.match(blankRegexp) || [];
  const total = orderedIds.length;
  const position = orderedIds.indexOf(blankId) + 1;
  // Inputs are generated from the prompt's own tokens, so position is always
  // >= 1 in practice; fall back gracefully if a caller passes an unknown id.
  if (position === 0) return "Blank";
  return total > 1 ? `Blank ${position} of ${total}` : "Blank";
};

// Accessible description (announced on focus) giving the full prompt as context.
// This is needed because focus mode skips the prose around an inline input.
export const getPromptContextDescription = (prompt: string) =>
  `Full text: ${getBlankLabelContext(prompt)}`;

export const Runtime: React.FC<IProps> = ({ authoredState, interactiveState, setInteractiveState, report }) => {
  const decorateOptions = useGlossaryDecoration();
  const readOnly = !!(report || (authoredState.required && interactiveState?.submitted));

  const handleChange = useCallback((blankId: string, value: string) => {
    setInteractiveState?.(prevState => {
      const newState: IInteractiveState = {
        ...prevState,
        answerType: "interactive_state",
        blanks: prevState?.blanks?.slice() || []
      };
      const newResponse = {id: blankId, response: value };
      const existingResponse = newState.blanks.find(b => b.id === blankId);
      if (existingResponse) {
        const idx = newState.blanks.indexOf(existingResponse);
        newState.blanks.splice(idx, 1, newResponse);
      } else {
        newState.blanks.push(newResponse);
      }
      newState.answerText = striptags(replaceBlanksWithValues({
                              prompt: authoredState.prompt || "",
                              blanks: authoredState.blanks || [],
                              responses: newState.blanks
                            }));
      return newState;
    });
  }, [authoredState.prompt, authoredState.blanks, setInteractiveState]);

  const replaceInputs: ParseHTMLReplacer = domNode => {
    if (domNode.name === "input") {
      const blankId = domNode.attribs?.id;
      if (blankId) {
        const { authorInfo, userInfo } = getBlankInfo(blankId,
                                                      authoredState.blanks || [],
                                                      interactiveState?.blanks || []);
        const _handleChange = (event: React.ChangeEvent<HTMLInputElement>) => handleChange(blankId, event.target.value);
        // clicks are swallowed so the outer dynamic text is not triggered
        const _swallowClicks = (event: React.MouseEvent<HTMLInputElement>) => event.stopPropagation();
        return (
          <input id={blankId} type="text"
            aria-label={getBlankAriaLabel(authoredState.prompt || "", blankId)}
            aria-describedby={blankContextId}
            className={getInputClass(report, userInfo?.response, authorInfo?.matchTerm)}
            value={userInfo?.response || ""}
            size={authorInfo?.size || defaultBlankSize}
            readOnly={readOnly}
            disabled={readOnly}
            onChange={_handleChange}
            onClick={_swallowClicks}
            />
        );
      }
    }
  };

  const promptText = authoredState.prompt || "";
  const hasBlanks = (promptText.match(blankRegexp) || []).length > 0;
  const htmlContents = replaceBlanksWithInputs(promptText);
  return (
    <div className="fill-in-the-blank">
      <DecorateChildren decorateOptions={decorateOptions}>
        <DynamicText>{renderHTML(htmlContents, replaceInputs)}</DynamicText>
      </DecorateChildren>
      {/* Hidden context shared by all blanks via aria-describedby. Uses `hidden`
          (not a visually-hidden class) so it is not re-read during linear/browse
          reading, only resolved as each input's description on focus. */}
      { hasBlanks && <span id={blankContextId} hidden>{getPromptContextDescription(promptText)}</span> }
    </div>
  );
};
