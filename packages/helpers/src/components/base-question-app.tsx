import React, { useEffect, useRef } from "react";
import { DynamicTextContext, useDynamicTextProxy } from "@concord-consortium/dynamic-text";

import { useAutoHeight } from "../hooks/use-auto-height";
import { useHint } from "../hooks/use-hint";
import { useRequiredQuestion } from "../hooks/use-required-question";
import { useShutterbug } from "../hooks/use-shutterbug";
import { BaseAuthoring, IBaseAuthoringProps } from "./base-authoring";
import { SubmitButton } from "./submit-button";
import { LockedInfo } from "./locked-info";
import {
  IAuthoringMetadata, IRuntimeMetadata, setSupportedFeatures, useAuthoredState, useInitMessage, useInteractiveState,
  IReportInitInteractive
} from "@concord-consortium/lara-interactive-api";
import { IBaseAuthoredState, UpdateFunc, IAuthoringComponentProps, IRuntimeComponentProps } from "./base-app";
import { useBasicLogging } from "../hooks/use-basic-logging";
import { useLinkedInteractives } from "../hooks/use-linked-interactives";
import { ILinkedInteractiveProp } from "../hooks/use-linked-interactives-authoring";
import { InitMessageContext } from "../hooks/use-context-init-message";
import { useFontSize } from "../hooks/use-font-size";

import css from "./base-app.scss";

interface IBaseQuestionAuthoredState extends IBaseAuthoredState {
  hint?: string;
  required?: boolean;
  predictionFeedback?: string;
}

interface IBaseQuestionInteractiveState {
  submitted?: boolean;
}

export interface IRuntimeQuestionComponentProps<IAuthoredState, IInteractiveState> extends IRuntimeComponentProps<IAuthoredState> {
  interactiveState?: IInteractiveState | null;
  setInteractiveState?: (updateFunc: UpdateFunc<IInteractiveState>) => void;
  report?: boolean;
  view?: "standalone";
}

interface IProps<IAuthoredState, IInteractiveState> {
  // Question can provide either fully custom Authoring component or use BaseAuthoring (that uses react-jsonschema-form).
  Authoring?: React.FC<IAuthoringComponentProps<IAuthoredState>>;
  baseAuthoringProps?: Omit<IBaseAuthoringProps<IAuthoredState>, "authoredState" | "setAuthoredState">;
  Runtime: React.FC<IRuntimeQuestionComponentProps<IAuthoredState, IInteractiveState>>;
  disableAutoHeight?: boolean;
  disableSubmitBtnRendering?: boolean;
  // Note that isAnswered is required when `disableSubmitBtnRendering` is false.
  isAnswered?: (state: IInteractiveState | null, authoredState?: IAuthoredState) => boolean;
  linkedInteractiveProps?: ILinkedInteractiveProp[];
  migrateAuthoredState?: (oldAuthoredState: any) => IAuthoredState;
}

// BaseApp for interactives that save interactive state and show in the report. E.g. open response, multiple choice.
export const BaseQuestionApp = <IAuthoredState extends IAuthoringMetadata & IBaseQuestionAuthoredState,
  IInteractiveState extends IRuntimeMetadata & IBaseQuestionInteractiveState>(props: IProps<IAuthoredState, IInteractiveState>) => {
  const { Authoring, baseAuthoringProps, Runtime, isAnswered, disableAutoHeight, disableSubmitBtnRendering,
    linkedInteractiveProps, migrateAuthoredState } = props;
  const container = useRef<HTMLDivElement>(null);
  const useAuthStateResult = useAuthoredState<IAuthoredState>();
  const authoredState = migrateAuthoredState && useAuthStateResult.authoredState ?
    migrateAuthoredState(useAuthStateResult.authoredState) : useAuthStateResult.authoredState;
  const setAuthoredState = useAuthStateResult.setAuthoredState;
  const { interactiveState, setInteractiveState } = useInteractiveState<IInteractiveState>();
  const initMessage = useInitMessage();
  const isLoading = !initMessage;
  const isRuntimeView = initMessage?.mode === "runtime";

  const dynamicTextProxy = useDynamicTextProxy();

  useAutoHeight({ container: container.current, disabled: isRuntimeView && disableAutoHeight || isLoading });
  useHint();
  useRequiredQuestion(initMessage);
  useShutterbug({ container: "." + css.runtime });
  useBasicLogging({ disabled: !isRuntimeView });
  useLinkedInteractives(linkedInteractiveProps?.map(li => li.label), initMessage);
  useFontSize({updateHtml: true});

  useEffect(() => {
    setSupportedFeatures({
      interactiveState: true,
      authoredState: true
    });
  }, [initMessage]);

  if (!isAnswered && !disableSubmitBtnRendering) {
    throw new Error("isAnswered function is required when disableSubmitBtnRendering = false");
  }

  const renderAuthoring = () => {
    if (Authoring) {
      return <Authoring authoredState={authoredState} setAuthoredState={setAuthoredState} />;
    }
    if (!Authoring && baseAuthoringProps) {
      return <BaseAuthoring
        {...baseAuthoringProps}
        linkedInteractiveProps={linkedInteractiveProps}
        authoredState={authoredState}
        setAuthoredState={setAuthoredState}
      />;
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
            <SubmitButton isAnswered={!!isAnswered?.(interactiveState, authoredState)} />
            <LockedInfo />
          </div>
        }
      </div>
    );
  };

  const renderReport = () => {
    const reportInitMessage = initMessage as IReportInitInteractive;
    const view = reportInitMessage?.view;
    if (!authoredState) {
      return "Authored state is missing.";
    }
    return (
      <div className={css.runtime}>
        <Runtime authoredState={authoredState} interactiveState={interactiveState} setInteractiveState={setInteractiveState} report={true} view={view} />
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
        return "Loading...";
    }
  };

  return (
    <div ref={container}>
      <InitMessageContext.Provider value={initMessage}>
        <DynamicTextContext.Provider value={dynamicTextProxy}>
          { renderMode() }
        </DynamicTextContext.Provider>
      </InitMessageContext.Provider>
    </div>
  );
};
