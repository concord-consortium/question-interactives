import React, { useRef } from "react";
import { useLARAInteractiveAPI } from "../../shared/hooks/use-lara-interactive-api";
import { useAutoHeight } from "../../shared/hooks/use-auto-height";
import { Authoring } from "./authoring";
import { Runtime } from "./runtime";

export const App = () => {
  const container = useRef<HTMLDivElement>(null);
  const { mode, authoredState, interactiveState, setInteractiveState, setAuthoredState, setHeight } = useLARAInteractiveAPI({
    interactiveState: true,
    authoredState: true,
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
