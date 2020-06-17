import React, { useEffect, useRef } from "react";
import { useAutoHeight } from "../hooks/use-auto-height";
import { useShutterbug } from "../hooks/use-shutterbug";
import { BaseAuthoring, IBaseAuthoringProps } from "./base-authoring";
import { setSupportedFeatures, useAuthoredState, useInitMessage } from "@concord-consortium/lara-interactive-api";

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
}

// BaseApp for interactives that don't save interactive state and don't show up in the report. E.g. image, video.
export const BaseApp = <IAuthoredState extends IBaseAuthoredState>(props: IProps<IAuthoredState>) => {
  const { Authoring, baseAuthoringProps, Runtime, disableAutoHeight } = props;
  const container = useRef<HTMLDivElement>(null);
  const { authoredState, setAuthoredState } = useAuthoredState<IAuthoredState>();
  const initMessage = useInitMessage();

  const isAuthoringView = initMessage?.mode === "authoring";
  useAutoHeight({ container, disabled: !isAuthoringView && disableAutoHeight });
  useShutterbug({ container: "." + css.runtime });

  useEffect(() => {
    setSupportedFeatures({
      authoredState: true
    });
  }, []);

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
        <Runtime authoredState={authoredState} />
      </div>
    );
  };

  const renderMode = () => {
    switch (initMessage?.mode) {
      case "authoring":
        return renderAuthoring();
      case "runtime":
        return renderRuntime();
      default:
        return "Loading..."
    }
  };

  return (
    <div ref={container}>{ renderMode() }</div>
  );
};
