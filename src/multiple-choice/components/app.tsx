import React, { useEffect, useRef, useState } from "react";
import { useLARAInteractiveAPI } from "../../shared/hooks/use-lara-interactive-api";
import { Authoring } from "./authoring";
import { Runtime } from "./runtime";

export const App = () => {
  const [ aspectRatio, setAspectRatio ] = useState(1);
  const interactiveAPIConfig = {
    interactiveState: true,
    authoredState: true,
    aspectRatio
  };
  const { mode, authoredState, interactiveState, setInteractiveState, setAuthoredState } = useLARAInteractiveAPI(interactiveAPIConfig);
  const container = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Measure the main app container on every re-render and update aspect ratio. Note that useLARAInteractiveAPI
    // takes care of its updates and will notify LARA about it using iframe phone.
    const width = container.current?.offsetWidth;
    const height = container.current?.offsetHeight
    if (width && width > 0 && height && height > 0) {
      setAspectRatio(width / height);
    }
  });

  return (
    <div ref={container}>
      { mode === "authoring" && <Authoring authoredState={authoredState} setAuthoredState={setAuthoredState} /> }
      { mode === "runtime" && <Runtime authoredState={authoredState} interactiveState={interactiveState} setInteractiveState={setInteractiveState} /> }
      { mode === undefined && "Loading..." }
    </div>
  );
};

