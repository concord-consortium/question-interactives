import React, { useEffect, useRef } from "react";
import { setSupportedFeatures, useAuthoredState, useInitMessage } from "@concord-consortium/lara-interactive-api";
import { DynamicTextContext, useDynamicTextProxy } from "@concord-consortium/dynamic-text";

import { useAutoHeight } from "../hooks/use-auto-height";
import { useShutterbug } from "../hooks/use-shutterbug";
import { BaseAuthoring, IBaseAuthoringProps } from "./base-authoring";
import { useBasicLogging } from "../hooks/use-basic-logging";
import { useLinkedInteractives } from "../hooks/use-linked-interactives";
import { ILinkedInteractiveProp } from "../hooks/use-linked-interactives-authoring";
import { InitMessageContext } from "../hooks/use-context-init-message";

import css from "./base-app.scss";

export type UpdateFunc<State> = (prevState: State | null) => State;

export interface IBaseAuthoredState {
  version: number;
}

export interface IAuthoringComponentProps<IAuthoredState> {
  authoredState: IAuthoredState | null;
  setAuthoredState?: (updateFunc: UpdateFunc<IAuthoredState>) => void;
}

export interface IRuntimeComponentProps<IAuthoredState> {
  authoredState: IAuthoredState;
}

interface IProps<IAuthoredState> {
  // Question can provide either fully custom Authoring component or use BaseAuthoring (that uses react-jsonschema-form).
  Authoring?: React.FC<IAuthoringComponentProps<IAuthoredState>>;
  baseAuthoringProps?: Omit<IBaseAuthoringProps<IAuthoredState>, "authoredState" | "setAuthoredState">;
  Runtime: React.FC<IRuntimeComponentProps<IAuthoredState>>;
  disableAutoHeight?: boolean;
  linkedInteractiveProps?: ILinkedInteractiveProp[];
  migrateAuthoredState?: (oldAuthoredState: any) => IAuthoredState;
}

// BaseApp for interactives that don't save interactive state and don't show up in the report. E.g. image, video.
export const BaseApp = <IAuthoredState extends IBaseAuthoredState>(props: IProps<IAuthoredState>) => {
  const { Authoring, baseAuthoringProps, Runtime, disableAutoHeight, linkedInteractiveProps, migrateAuthoredState } = props;
  const container = useRef<HTMLDivElement>(null);
  const useAuthStateResult = useAuthoredState<IAuthoredState>();
  const authoredState = migrateAuthoredState && useAuthStateResult.authoredState ?
    migrateAuthoredState(useAuthStateResult.authoredState) : useAuthStateResult.authoredState;
  const setAuthoredState = useAuthStateResult.setAuthoredState;
  const initMessage = useInitMessage();
  const isLoading = !initMessage;
  const isRuntimeView = initMessage?.mode === "runtime";

  const dynamicTextProxy = useDynamicTextProxy();

  useAutoHeight({ container: container.current, disabled: isRuntimeView && disableAutoHeight || isLoading });
  useShutterbug({ container: "." + css.runtime });
  useBasicLogging({ disabled: !isRuntimeView });
  useLinkedInteractives(linkedInteractiveProps?.map(li => li.label), initMessage);

  useEffect(() => {
    setSupportedFeatures({
      authoredState: true
    });
  }, [initMessage]);

  const renderAuthoring = () => {
    if (Authoring) {
      return <Authoring authoredState={authoredState} setAuthoredState={setAuthoredState} />;
    }
    if (!Authoring && baseAuthoringProps) {
      return <BaseAuthoring
        {...baseAuthoringProps}
        authoredState={authoredState}
        setAuthoredState={setAuthoredState}
        linkedInteractiveProps={linkedInteractiveProps}
      />;
    }
  };

  const renderRuntime = () => {
    if (!authoredState) {
      return "Authored state is missing.";
    }
    return (
      <div className={css.runtime}>
        <Runtime authoredState={authoredState} />
      </div>
    );
  };

  const renderMode = () => {
    switch (initMessage?.mode) {
      case "authoring":
        return renderAuthoring();
      case "runtime":
      case "report":
        return renderRuntime();
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
