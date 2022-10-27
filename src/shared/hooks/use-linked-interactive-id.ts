import { useContextInitMessage } from "./use-context-init-message";
import { ILinkedInteractive } from "@concord-consortium/lara-interactive-api";

export const useLinkedInteractiveId = (label: string) => {
  const initMessage = useContextInitMessage();
  let linkedInteractives = (initMessage && initMessage.mode !== "reportItem") ? initMessage.linkedInteractives : [];
  // This is workaround of a bug in LARA. Usually the init message is like:
  // `linkedInteractives: [ ... ]`
  // as that's what LARA ManagedInteractive.to_hash returns.
  // However, after saving the interactive edit dialog there's an unnecessary nesting:
  // `linkedInteractives: { linkedInteractives: [ ... ] }`
  // It happens because LARA page_item.set_linked_interactives expects linked interactives to include two separate
  // props: linkedInteractives and linkedState (optional). And they get embedded in the edit form that is later
  // used to generate the init message.
  if ((linkedInteractives as any).linkedInteractives) {
    linkedInteractives = (linkedInteractives as any).linkedInteractives;
  }
  const linkedInteractive = linkedInteractives.find((interactive: ILinkedInteractive) => interactive.label === label);
  return linkedInteractive?.id;
};
