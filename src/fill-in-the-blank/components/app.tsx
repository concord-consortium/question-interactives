import React, { useRef } from "react";
import { useLaraInteractiveApi } from "@concord-consortium/lara-interactive-api";

import { useAutoHeight } from "../../shared/hooks/use-auto-height";
import { Authoring, IAuthoredState } from "./authoring";
import { Runtime, IInteractiveState } from "./runtime";


export const App = () => {
  const container = useRef<HTMLDivElement>(null);
  const { mode, authoredState, interactiveState, setInteractiveState, setAuthoredState, setHeight } = useLaraInteractiveApi<IAuthoredState, IInteractiveState>({
    supportedFeatures: {
      interactiveState: true,
      authoredState: true,
    }
  });
  useAutoHeight({ container, setHeight });

  const report = mode === "report";
  return (
    <div ref={container}>
      { mode === "authoring" && <Authoring authoredState={authoredState} setAuthoredState={setAuthoredState} /> }
      { (mode === "runtime" || report) && <Runtime authoredState={authoredState} interactiveState={interactiveState} setInteractiveState={setInteractiveState} report={report}/> }
      { mode === undefined && "Loading..." }
    </div>
  );
};
