import { useEffect, useRef } from "react";
import { useAuthoredState, useInitMessage } from "@concord-consortium/lara-interactive-api";

// This hook accepts list of props that are pointing to other interactives and ensures the most recent ID
// coming from LARA is being used. Note that ID might change when activity is copied or when interactive is removed.
// It works both in authoring and runtime mode.
export const useLinkedInteractives = (linkedInteractiveNames: string[] | undefined) => {
  const initMessage = useInitMessage();
  const { authoredState, setAuthoredState } = useAuthoredState<any>();
  const initialLinkedInteractivesProcessed = useRef(false);
  const linkedInteractives = (initMessage?.mode === "authoring" || initMessage?.mode === "runtime") && initMessage.linkedInteractives;

  useEffect(() => {
    // Note that this hook needs to be executed only once, right after interactive is initialized.
    // In the authoring mode an author might later change a property that is a linked interactive. It shouldn't
    // be reset in this case. This case it's handled by useLinkedInteractivesAuthoring hook.
    if (linkedInteractiveNames &&
        authoredState &&
        (initMessage?.mode === "authoring" || initMessage?.mode === "runtime") &&
        !initialLinkedInteractivesProcessed.current)
    {
      linkedInteractiveNames.forEach(name => {
        const authoredStateVal = authoredState[name];
        const linkedInteractive = linkedInteractives && linkedInteractives.find(l => l.label === name);
        if (!linkedInteractive && authoredStateVal !== undefined) {
          // Linked interactive no longer present, clear the authoredState value.
          setAuthoredState((prevAuthoredState: any) => Object.assign({}, prevAuthoredState, {[name]: undefined}));
        } else if (linkedInteractive && linkedInteractive.id !== authoredStateVal) {
          // Update authoredState value.
          setAuthoredState((prevAuthoredState: any) => Object.assign({}, prevAuthoredState, {[name]: linkedInteractive.id}));
        }
      });
      initialLinkedInteractivesProcessed.current = true;
    }
  }, [initMessage?.mode, linkedInteractives, linkedInteractiveNames, authoredState, setAuthoredState]);
};
