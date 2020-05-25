import React, { useEffect } from "react";

interface IConfig {
  authoredState: { hint?: string } | undefined;
  setHint: ((hint: string | undefined) => void) | undefined;
}

// This hook can be used by any interactive that defines `hint` property in its authored state.
export const useHint = ({ authoredState, setHint }: IConfig) => {
  useEffect(() => {
    if (authoredState && setHint) {
      setHint(authoredState.hint);
    }
  }, [authoredState?.hint]);
};
