import React, { useEffect } from "react";

interface IConfig {
  authoredState: { required?: boolean } | undefined;
  interactiveState: { submitted?: boolean } | undefined;
  setNavigation: ((enableForwardNav: boolean, message: string) => void) | undefined;
}

// This hook can be used by any interactive that defines `required` property in its authored state and
// `submitted` property in its interactive state (student state).
export const useRequiredQuestion = ({ authoredState, interactiveState, setNavigation }: IConfig) => {
  useEffect(() => {
    if (authoredState?.required && setNavigation) {
      const forwardNavEnabled = !!interactiveState?.submitted;
      setNavigation(forwardNavEnabled, forwardNavEnabled ? "" : "Please submit an answer first.");
    }
  }, [authoredState?.required, interactiveState?.submitted]);
};
