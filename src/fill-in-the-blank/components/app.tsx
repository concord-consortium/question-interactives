import React, { useRef } from "react";
import { useLARAInteractiveAPI } from "../../shared/hooks/use-lara-interactive-api";
import { useAutoHeight } from "../../shared/hooks/use-auto-height";
import { Authoring, IAuthoredState } from "./authoring";
import { IInteractiveState, Runtime } from "./runtime";

export const App = () => {
  const container = useRef<HTMLDivElement>(null);
  const { mode, authoredState, interactiveState, setInteractiveState, setAuthoredState, setHeight, setNavigation } = useLARAInteractiveAPI<IAuthoredState, IInteractiveState>({
    interactiveState: true,
    authoredState: true,
  });
  useAutoHeight({ container, setHeight });

  const report = mode === "report";
  const authoring = mode === "authoring";
  const runtime = mode === "runtime";
  return (
    <div ref={container}>
      { authoring && <Authoring authoredState={authoredState} setAuthoredState={setAuthoredState} /> }
      { (runtime || report) && authoredState && <Runtime authoredState={authoredState} interactiveState={interactiveState} setInteractiveState={setInteractiveState} report={report} setNavigation={setNavigation} /> }
      { mode === undefined && "Loading..." }
    </div>
  );
};
