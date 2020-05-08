import React, { useEffect, useRef, useState } from "react";
import { useLARAInteractiveAPI } from "../../shared/hooks/use-lara-interactive-api";
import { Authoring } from "./authoring";
import { Runtime } from "./runtime";

export const App = () => {
  const interactiveAPIConfig = {
    interactiveState: true,
    authoredState: true,
  };
  const { mode, authoredState, interactiveState, setInteractiveState, setAuthoredState, setHeight } = useLARAInteractiveAPI(interactiveAPIConfig);
  const container = useRef<HTMLDivElement>(null);

  const calcHeight = () => {
    const height = container.current?.offsetHeight
    if (height && height > 0) {
      setHeight(height);
    }
  };

  // Update height on every re-render.
  useEffect(calcHeight);

  useEffect(() => {
    // It's necessary to wrap calcHeight in a closure function. Note that calcHeight will be recreated on every render.
    // This will break the cleanup function which would try to remove wrong reference. resizeHandler is created
    // only once, as useEffect has empty dependencies list.
    const resizeHandler = () => calcHeight();
    window.addEventListener("resize", resizeHandler);
    return () => window.removeEventListener("resize", resizeHandler);
  }, []);

  return (
    <div ref={container}>
      { mode === "authoring" && <Authoring authoredState={authoredState} setAuthoredState={setAuthoredState} /> }
      { mode === "runtime" && <Runtime authoredState={authoredState} interactiveState={interactiveState} setInteractiveState={setInteractiveState} /> }
      { mode === undefined && "Loading..." }
    </div>
  );
};

