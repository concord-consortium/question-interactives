import React, { useEffect, useCallback, useRef } from "react";
import { IRuntimeQuestionComponentProps } from "../../shared/components/base-question-app";
import { blankRegexp, defaultBlankSize, IAuthoredState, IBlankDef, IFilledBlank, IInteractiveState } from "./types";
import css from "./runtime.scss";

interface IProps extends IRuntimeQuestionComponentProps<IAuthoredState, IInteractiveState> {
  setNavigation?: (enableForwardNav: boolean, message: string) => void;
}

const getInputClass = (report?: boolean, value?: string, matchTerm?: string) => {
  if (!report || !matchTerm) return "";
  return value === matchTerm ? css.correctAnswer : css.incorrectAnswer;
}

const getBlankInfo = (blankId: string, blanks: IBlankDef[], userResponses: IFilledBlank[]) => {
  return {
    authorInfo: blanks.find(blank => blank.id === blankId),
    userInfo: userResponses.find(blank => blank.id === blankId)
  };
}

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

interface IReplaceBlanksWithInputs extends IReplaceBlanksWithValues{
  report: boolean;
  readOnly: boolean;
}
export const replaceBlanksWithInputs = (args: IReplaceBlanksWithInputs) => {
  const { prompt, blanks, responses, report, readOnly } = args;
  return prompt.replace(blankRegexp, blankId => {
    const { authorInfo, userInfo } = getBlankInfo(blankId, blanks, responses);
    const id = `id="${blankId}"`;
    const _class = `class="${getInputClass(report, userInfo?.response, authorInfo?.matchTerm)}"`;
    const value = `value="${userInfo?.response || ""}"`;
    const size = `size="${authorInfo?.size || defaultBlankSize}"`;
    const _readOnly = readOnly ? "readonly disabled" : "";
    return `<input ${id} type="text" ${_class} ${value} ${size} ${_readOnly}/>`;
  });
};

const handlers: Record<string, (event: any) => void> = {};

export const Runtime: React.FC<IProps> = ({ authoredState, interactiveState, setInteractiveState, report }) => {

  const handleChange = useCallback((blankId: string, event: React.ChangeEvent<HTMLInputElement>) => {
    setInteractiveState?.(prevState => {
      const newState: IInteractiveState = {
        ...prevState,
        answerType: "interactive_state",
        blanks: prevState?.blanks?.slice() || []
      };
      const newResponse = {id: blankId, response: event.target.value };
      const existingResponse = newState.blanks.find(b => b.id === blankId);
      if (existingResponse) {
        const idx = newState.blanks.indexOf(existingResponse);
        newState.blanks.splice(idx, 1, newResponse);
      } else {
        newState.blanks.push(newResponse);
      }
      newState.answerText = replaceBlanksWithValues({
                              prompt: authoredState.prompt || "",
                              blanks: authoredState.blanks || [],
                              responses: newState.blanks
                            });
      return newState;
    });
  }, [authoredState.prompt, authoredState.blanks]);

  const domRef = useRef<HTMLDivElement | null>();

  useEffect(() => {
    const blanks = authoredState.blanks || [];
    blanks.forEach(blank => {
      const input = domRef.current?.querySelector(`input[id="${blank.id}"]`);
      if (input) {
        handlers[blank.id] = (event: any) => handleChange(blank.id, event);
        input.addEventListener("change", handlers[blank.id]);
      }
    });

    return () => {
      blanks.forEach(blank => {
        const input = domRef.current?.querySelector(`input[id="${blank.id}"]`);
        if (input) {
          input.removeEventListener("change", handlers[blank.id]);
          delete handlers[blank.id];
        }
      });
    };
    // no dependency array because inputs get regenerated on each render,
    // so we need to add/remove listeners on each render as well.
  });

  const readOnly = report || (authoredState.required && interactiveState?.submitted);
  const contents = replaceBlanksWithInputs({
                    prompt: authoredState.prompt || "",
                    blanks: authoredState.blanks || [],
                    responses: interactiveState?.blanks || [],
                    report: !!report,
                    readOnly: !!readOnly
                  });
  return (
    <div className="fill-in-the-blank"
        ref={elt => domRef.current = elt}
        dangerouslySetInnerHTML={{ __html: contents }} />
  );
};
