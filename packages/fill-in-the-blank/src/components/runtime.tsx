import React, { useCallback } from "react";
import striptags from "striptags";
import { IRuntimeQuestionComponentProps } from "@concord-consortium/question-interactives-helpers/src/components/base-question-app";
import { ParseHTMLReplacer, renderHTML } from "@concord-consortium/question-interactives-helpers/src/utilities/render-html";
import { blankRegexp, defaultBlankSize, IAuthoredState, IBlankDef, IFilledBlank, IInteractiveState } from "./types";
import { DecorateChildren } from "@concord-consortium/text-decorator";
import { useGlossaryDecoration } from "@concord-consortium/question-interactives-helpers/src/hooks/use-glossary-decoration";
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
        return (
          <input id={blankId} type="text"
            className={getInputClass(report, userInfo?.response, authorInfo?.matchTerm)}
            value={userInfo?.response || ""}
            size={authorInfo?.size || defaultBlankSize}
            readOnly={readOnly}
            disabled={readOnly}
            onChange={_handleChange}
            />
        );
      }
    }
  };

  const htmlContents = replaceBlanksWithInputs(authoredState.prompt || "");
  return (
    <div className="fill-in-the-blank">
      <DecorateChildren decorateOptions={decorateOptions}>
        {renderHTML(htmlContents, replaceInputs)}
      </DecorateChildren>
    </div>
  );
};
