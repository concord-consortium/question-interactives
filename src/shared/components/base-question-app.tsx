import React, { useEffect, useRef } from "react";
import { useAutoHeight } from "../hooks/use-auto-height";
import { useHint } from "../hooks/use-hint";
import { useRequiredQuestion } from "../hooks/use-required-question";
import { useShutterbug } from "../hooks/use-shutterbug";
import { BaseAuthoring, IBaseAuthoringProps } from "./base-authoring";
import { SubmitButton } from "./submit-button";
import { LockedInfo } from "./locked-info";
import {
  IAuthoringMetadata, IRuntimeMetadata, setSupportedFeatures, useAuthoredState, useInitMessage, useInteractiveState
} from "@concord-consortium/lara-interactive-api";
import { IBaseAuthoredState, UpdateFunc, IAuthoringComponentProps, IRuntimeComponentProps } from "./base-app";
import { useBasicLogging } from "../hooks/use-basic-logging";

import css from "./base-app.scss";

interface IBaseQuestionAuthoredState extends IBaseAuthoredState {
  hint?: string;
  required?: boolean;
  predictionFeedback?: string;
}

interface IBaseQuestionInteractiveState {
  submitted?: boolean;
}

interface IRuntimeQuestionComponentProps<IAuthoredState, IInteractiveState> extends IRuntimeComponentProps<IAuthoredState> {
  interactiveState?: IInteractiveState | null,
  setInteractiveState?: (updateFunc: UpdateFunc<IInteractiveState>) => void;
  report?: boolean;
}

interface IProps<IAuthoredState, IInteractiveState> {
  // Question can provide either fully custom Authoring component or use BaseAuthoring (that uses react-jsonschema-form).
  Authoring?: React.FC<IAuthoringComponentProps<IAuthoredState>>;
  baseAuthoringProps?: Omit<IBaseAuthoringProps<IAuthoredState>, "authoredState" | "setAuthoredState">;
  Runtime: React.FC<IRuntimeQuestionComponentProps<IAuthoredState, IInteractiveState>>;
  disableAutoHeight?: boolean;
  disableSubmitBtnRendering?: boolean;
  // Note that isAnswered is required when `disableSubmitBtnRendering` is false.
  isAnswered?: (state: IInteractiveState | null) => boolean;
  disableBasicLogging?: boolean;
}

// BaseApp for interactives that save interactive state and show in the report. E.g. open response, multiple choice.
export const BaseQuestionApp = <IAuthoredState extends IAuthoringMetadata & IBaseQuestionAuthoredState,
  IInteractiveState extends IRuntimeMetadata & IBaseQuestionInteractiveState>(props: IProps<IAuthoredState, IInteractiveState>) => {
  const { Authoring, baseAuthoringProps, Runtime, isAnswered, disableAutoHeight, disableSubmitBtnRendering, disableBasicLogging } = props;
  const container = useRef<HTMLDivElement>(null);
  const { authoredState, setAuthoredState } = useAuthoredState<IAuthoredState>();
  const { interactiveState, setInteractiveState } = useInteractiveState<IInteractiveState>();
  const initMessage = useInitMessage();

  const isRuntimeView = initMessage?.mode === "runtime";
  useAutoHeight({ container, disabled: isRuntimeView && disableAutoHeight });
  useHint();
  useRequiredQuestion();
  useShutterbug({ container: "." + css.runtime });
  const logging = useBasicLogging({ disabled: disableBasicLogging || !isRuntimeView });

  const setInteractiveStateWithLogging = (updateFunc: UpdateFunc<IInteractiveState>) => {
    setInteractiveState(updateFunc);
    // Notify logging helper that answer has been updated by user. Only then it'll be logged on blur.
    logging.onAnswerUpdate(updateFunc(interactiveState).answerText);
  };

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
        <Runtime authoredState={authoredState} interactiveState={interactiveState} setInteractiveState={setInteractiveStateWithLogging} />
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
