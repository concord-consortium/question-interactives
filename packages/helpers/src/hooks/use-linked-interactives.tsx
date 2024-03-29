import { useEffect, useRef } from "react";
import { IInitInteractive, ILinkedInteractive, useAuthoredState } from "@concord-consortium/lara-interactive-api";

// This hook accepts a list of props that are pointing to other interactives and ensures the most recent ID
// coming from LARA is being used. Note that ID might change when activity is copied or when interactive is removed.
// It works both in authoring and runtime mode.
export const useLinkedInteractives = (
  linkedInteractiveNames: string[] | undefined,
  initMessage: IInitInteractive | null
  ) => {
  const { authoredState, setAuthoredState } = useAuthoredState<Record<string, unknown>>();
  const initialLinkedInteractivesProcessed = useRef(false);
  const linkedInteractives = initMessage?.mode === "authoring" && initMessage.linkedInteractives;

  useEffect(() => {
    // Note that this hook needs to be executed only once, right after interactive is initialized.
    // In the authoring mode an author might later change a property that is a linked interactive. It shouldn't
    // be reset in this case. This case it's handled by useLinkedInteractivesAuthoring hook.
    if (
      !initialLinkedInteractivesProcessed.current &&
      linkedInteractiveNames &&
      authoredState &&
      initMessage?.mode === "authoring"
    ) {
      const newStateProps: Record<string, unknown> = {};
      linkedInteractiveNames.forEach(name => {
        const authoredStateVal = authoredState[name];
        const linkedInteractive = linkedInteractives && linkedInteractives.find((l: ILinkedInteractive) => l.label === name);
        if (!linkedInteractive && authoredStateVal !== undefined) {
          // Linked interactive no longer present, clear the authoredState value.
          newStateProps[name] = undefined;
        } else if (linkedInteractive && linkedInteractive.id !== authoredStateVal) {
          // Update authoredState value.
          newStateProps[name] = linkedInteractive.id;
        }
      });
      if (Object.keys(newStateProps).length > 0) {
        setAuthoredState(prevAuthoredState => ({...prevAuthoredState, ...newStateProps}));
      }
      initialLinkedInteractivesProcessed.current = true;
    }
  }, [initMessage?.mode, linkedInteractives, linkedInteractiveNames, authoredState, setAuthoredState]);
};
