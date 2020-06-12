import React, { useEffect, useRef } from "react";
import { useAutoHeight } from "../hooks/use-auto-height";
import { useHint } from "../hooks/use-hint";
import { useRequiredQuestion } from "../hooks/use-required-question";
import { BaseAuthoring, IBaseAuthoringProps } from "./base-authoring";
import { SubmitButton } from "./submit-button";
import { LockedInfo } from "./locked-info";
import {
  IAuthoringMetadata, IRuntimeMetadata, setSupportedFeatures, useAuthoredState, useInitMessage, useInteractiveState
} from "@concord-consortium/lara-interactive-api";

import css from "./base-question-app.scss";

interface IBaseQuestionAuthoredState {
  version: number;
  hint?: string;
  required?: boolean;
}

interface IBaseQuestionInteractiveState {
  submitted?: boolean;
}

type UpdateFunc<State> = (prevState: State | null) => State;

interface IAuthoringComponentProps<IAuthoredState> {
  authoredState: IAuthoredState | null,
  setAuthoredState?: (updateFunc: UpdateFunc<IAuthoredState>) => void;
}

interface IRuntimeComponentProps<IAuthoredState, IInteractiveState> {
  authoredState: IAuthoredState,
  interactiveState?: IInteractiveState | null,
  setInteractiveState?: (updateFunc: UpdateFunc<IInteractiveState>) => void;
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
  isAnswered?: (state: IInteractiveState | null) => boolean;
}

export const BaseQuestionApp =
  <IAuthoredState extends IAuthoringMetadata & IBaseQuestionAuthoredState, IInteractiveState extends IRuntimeMetadata & IBaseQuestionInteractiveState>(
  { Authoring, baseAuthoringProps, Runtime, isAnswered, disableAutoHeight, disableSubmitBtnRendering }: IProps<IAuthoredState, IInteractiveState>
) => {
  const container = useRef<HTMLDivElement>(null);
  const { authoredState, setAuthoredState } = useAuthoredState<IAuthoredState>();
  const { interactiveState, setInteractiveState } = useInteractiveState<IInteractiveState>();
  const initMessage = useInitMessage();

  useAutoHeight({ container, disabled: disableAutoHeight });
  useHint();
  useRequiredQuestion();

  useEffect(() => {
    setSupportedFeatures({
      interactiveState: true,
      authoredState: true
    });
  }, []);

  if (!isAnswered && !disableSubmitBtnRendering) {
    throw new Error("isAnswered function is required when disableSubmitBtnRendering = false");
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
            <SubmitButton isAnswered={!!isAnswered?.(interactiveState)} />
            <LockedInfo />
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
    switch (initMessage?.mode) {
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
