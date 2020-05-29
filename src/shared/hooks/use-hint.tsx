import React, { useEffect } from "react";
import { setHint, useAuthoredState } from "@concord-consortium/lara-interactive-api";

// This hook can be used by any interactive that defines `hint` property in its authored state.
export const useHint = () => {
  const { authoredState } = useAuthoredState<{ hint?: string }>();

  useEffect(() => {
    if (authoredState && setHint) {
      setHint(authoredState.hint || "");
    }
  }, [authoredState?.hint]);
};
