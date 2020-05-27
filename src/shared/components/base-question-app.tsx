import React, { useRef } from "react";
import { useLARAInteractiveAPI } from "../hooks/use-lara-interactive-api";
import { useAutoHeight } from "../hooks/use-auto-height";
import { useHint } from "../hooks/use-hint";
import { useRequiredQuestion } from "../hooks/use-required-question";
import { BaseAuthoring, IBaseAuthoringProps } from "./base-authoring";
import { SubmitButton } from "./submit-button";
import { LockedInfo } from "./locked-info";

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
  disableAutoHeight?: boolean;
  disableSubmitBtnRendering?: boolean;
  // Note that isAnswered is required when `disableSubmitBtnRendering` is false.
  isAnswered?: (state: IInteractiveState | undefined) => boolean;
}

export const BaseQuestionApp = <IAuthoredState extends IBaseQuestionAuthoredState, IInteractiveState extends IBaseQuestionInteractiveState>(
  { Authoring, baseAuthoringProps, Runtime, isAnswered, disableAutoHeight, disableSubmitBtnRendering }: IProps<IAuthoredState, IInteractiveState>
) => {
  const container = useRef<HTMLDivElement>(null);
  const { mode, authoredState, interactiveState, setInteractiveState, setAuthoredState, setHeight, setHint, setNavigation } = useLARAInteractiveAPI<IAuthoredState, IInteractiveState>({
    interactiveState: true,
    authoredState: true,
  });
  useAutoHeight({ container, setHeight, disabled: disableAutoHeight });
  useHint({ authoredState, setHint });
  useRequiredQuestion({ authoredState, interactiveState, setNavigation });

  if (!isAnswered && !disableSubmitBtnRendering) {
    throw new Error("isAnsered function is required when disableSubmitBtnRendering = false");
  }

  const renderAuthoring = () => {
    if (Authoring) {
      return <Authoring authoredState={authoredState} setAuthoredState={setAuthoredState} />;
    }
    if (!Authoring && baseAuthoringProps) {
      return <BaseAuthoring {...baseAuthoringProps} authoredState={authoredState} setAuthoredState={setAuthoredState} />;
    }
  };

  const renderRuntime = () => {
    if (!authoredState) {
      return "Authored state is missing.";
    }
    return (
      <div className={css.runtime}>
        <Runtime authoredState={authoredState} interactiveState={interactiveState} setInteractiveState={setInteractiveState} />
        {
          !disableSubmitBtnRendering &&
          <div>
            <SubmitButton authoredState={authoredState} interactiveState={interactiveState} setInteractiveState={setInteractiveState} isAnswered={!!isAnswered?.(interactiveState)} />
            <LockedInfo interactiveState={interactiveState} />
          </div>
        }
      </div>
    );
  };

  const renderReport = () => {
    if (!authoredState) {
      return "Authored state is missing.";
    }
    return (
      <div className={css.runtime}>
        <Runtime authoredState={authoredState} interactiveState={interactiveState} setInteractiveState={setInteractiveState} report={true} />
        { authoredState?.required && <div>Question has been { interactiveState?.submitted ? "" : "NOT" } submitted.</div> }
      </div>
    );
  };

  const renderMode = () => {
    switch (mode) {
      case "authoring":
        return renderAuthoring();
      case "runtime":
        return renderRuntime();
      case "report":
        return renderReport();
      default:
        return "Loading..."
    }
  };

  return (
    <div ref={container}>{ renderMode() }</div>
  );
};
