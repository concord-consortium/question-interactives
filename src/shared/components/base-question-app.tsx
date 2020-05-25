import React, { useRef } from "react";
import { useLARAInteractiveAPI } from "../hooks/use-lara-interactive-api";
import { useAutoHeight } from "../hooks/use-auto-height";
import { useHint } from "../hooks/use-hint";
import { useRequiredQuestion } from "../hooks/use-required-question";
import { BaseAuthoring, IBaseAuthoringProps } from "./base-authoring";

import css from "./base-question-app.scss";

interface IBaseQuestionAuthoredState {
  version: number;
  hint?: string;
  required?: boolean;
}

interface IBaseQuestionInteractiveState {
  submitted?: boolean;
}

interface IAuthoringComponentProps<IAuthoredState> {
  authoredState: IAuthoredState | undefined,
  setAuthoredState?: (state: IAuthoredState) => void;
}

interface IRuntimeComponentProps<IAuthoredState, IInteractiveState> {
  authoredState: IAuthoredState,
  interactiveState: IInteractiveState | undefined,
  setInteractiveState?: (state: IInteractiveState) => void;
  report?: boolean;
}

interface IProps<IAuthoredState, IInteractiveState> {
  // Question can provide either fully custom Authoring component or use BaseAuthoring (that uses react-jsonschema-form).
  Authoring?: React.FC<IAuthoringComponentProps<IAuthoredState>>;
  baseAuthoringProps?: Omit<IBaseAuthoringProps<IAuthoredState>, "authoredState" | "setAuthoredState">;
  Runtime: React.FC<IRuntimeComponentProps<IAuthoredState, IInteractiveState>>;
  isAnswered: (state: IInteractiveState | undefined) => boolean;
}

export const BaseQuestionApp = <IAuthoredState extends IBaseQuestionAuthoredState, IInteractiveState extends IBaseQuestionInteractiveState>(
  { Authoring, baseAuthoringProps, Runtime, isAnswered }: IProps<IAuthoredState, IInteractiveState>
) => {
  const container = useRef<HTMLDivElement>(null);
  const { mode, authoredState, interactiveState, setInteractiveState, setAuthoredState, setHeight, setHint, setNavigation } = useLARAInteractiveAPI<IAuthoredState, IInteractiveState>({
    interactiveState: true,
    authoredState: true,
  });
  useAutoHeight({ container, setHeight });
  useHint({ authoredState, setHint });
  const { submitButton, lockedInfo } = useRequiredQuestion({ authoredState, interactiveState, setInteractiveState, setNavigation, isAnswered: isAnswered(interactiveState) });

  const report = mode === "report";
  const authoring = mode === "authoring";
  const runtime = mode === "runtime";

  let AuthoringComp = null;
  if (authoring) {
    if (Authoring) {
      AuthoringComp = <Authoring authoredState={authoredState} setAuthoredState={setAuthoredState} />;
    }
    if (!Authoring && baseAuthoringProps) {
      AuthoringComp = <BaseAuthoring {...baseAuthoringProps} authoredState={authoredState} setAuthoredState={setAuthoredState} />;
    }
  }

  return (
    <div ref={container}>
      { AuthoringComp }
      {
        (runtime || report) && authoredState &&
        <div className={css.runtime}>
          <Runtime authoredState={authoredState} interactiveState={interactiveState} setInteractiveState={setInteractiveState} report={report} />
          {
            !report &&
            <div>
            { submitButton }
            { lockedInfo }
            </div>
          }
        </div>
      }
      { mode === undefined && "Loading..." }
    </div>
  );
};
