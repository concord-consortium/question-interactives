import React from "react";
import { IRuntimeQuestionComponentProps } from "../../shared/components/base-question-app";
import { renderHTML } from "../../shared/utilities/render-html";
import { IAuthoredState, IInteractiveState } from "./types";
import { DecorateChildren } from "@concord-consortium/text-decorator";
import { useGlossaryDecoration } from "../../shared/hooks/use-glossary-decoration";
import css from "./runtime.scss";

interface IProps extends IRuntimeQuestionComponentProps<IAuthoredState, IInteractiveState> {
}

export const Runtime: React.FC<IProps> = ({ authoredState, interactiveState, setInteractiveState, report }) => {
  const readOnly = report || (authoredState.required && interactiveState?.submitted);
  const placeholderText = "Please type your answer here.";
  const answerText = !interactiveState?.answerText ? authoredState.defaultAnswer : interactiveState.answerText;
  const handleChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInteractiveState?.(prevState => ({...prevState, answerType: "open_response_answer", answerText: event.target.value }));
  };
  const decorateOptions = useGlossaryDecoration();
  return (
    <fieldset>
      { authoredState.prompt &&
        <DecorateChildren decorateOptions={decorateOptions}>
          <legend className={css.prompt}>
            {renderHTML(authoredState.prompt)}
          </legend>
        </DecorateChildren> }
      <div>
        <textarea
          value={answerText}
          onChange={readOnly ? undefined : handleChange}
          readOnly={readOnly}
          disabled={readOnly}
          rows={8}
          placeholder={placeholderText}
        />
      </div>
    </fieldset>
  );
};
