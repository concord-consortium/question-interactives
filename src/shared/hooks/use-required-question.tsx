import React, { useEffect } from "react";
import { setNavigation, useAuthoredState, useInteractiveState, useInitMessage } from "@concord-consortium/lara-interactive-api";

// This hook can be used by any interactive that defines `required` property in its authored state and
// `submitted` property in its interactive state (student state).
export const useRequiredQuestion = () => {
  const { authoredState } = useAuthoredState<{ required?: boolean }>();
  const { interactiveState } = useInteractiveState<{ submitted?: boolean }>();
  const initMessage = useInitMessage();

  useEffect(() => {
    if (initMessage?.mode === "runtime" && authoredState?.required) {
      const enableForwardNav = !!interactiveState?.submitted;
      setNavigation({ enableForwardNav, message: enableForwardNav ? "" : "Please submit an answer first." });
    }
  }, [authoredState?.required, interactiveState?.submitted, initMessage?.mode]);
};
