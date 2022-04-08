import { useContextInitMessage } from "./use-context-init-message";
import { ILinkedInteractive } from "@concord-consortium/lara-interactive-api";

export const useLinkedInteractiveId = (label: string) => {
  const initMessage = useContextInitMessage();
  const linkedInteractives = (initMessage?.mode === "authoring" || initMessage?.mode === "runtime") ? initMessage.linkedInteractives : [];
  const linkedInteractive = linkedInteractives.find((interactive: ILinkedInteractive) => interactive.label === label);
  return linkedInteractive?.id;
};
