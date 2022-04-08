import { useInitMessage } from "@concord-consortium/lara-interactive-api";

export const useLinkedInteractiveId = (label: string) => {
  const initMessage = useInitMessage();
  const linkedInteractives = (initMessage?.mode === "authoring" || initMessage?.mode === "runtime") ? initMessage.linkedInteractives : [];
  const linkedInteractive = linkedInteractives.find(interactive => interactive.label === label);
  return linkedInteractive?.id;
};
