import { useEffect, useState } from "react";
import deepmerge from "deepmerge";
import { RJSFSchema } from "@rjsf/utils";
import {
  useAuthoredState, getInteractiveList, ILinkedInteractive, setLinkedInteractives
} from "@concord-consortium/lara-interactive-api";
import { useContextInitMessage } from "./use-context-init-message";
import usePrevious from "react-hooks-use-previous";

export interface ILinkedInteractiveProp {
  label: string;
  supportsSnapshots?: boolean;
}

export interface IProps {
  linkedInteractiveProps?: ILinkedInteractiveProp[];
  schema: RJSFSchema;
}

type AuthoredState = Record<string, any>;
const emptyArray: ILinkedInteractive[] = [];

const getNestedObject = (object: Record<string, any>, targetProp: string): Record<string, any> | undefined => {
  for (const prop in object) {
    if (prop === targetProp && object[prop].type === "string") {
      return object[prop];
    }
  }
  const nestedResults = Object.keys(object)
    .map(key => typeof object[key] === "object" ? getNestedObject(object[key], targetProp) : undefined)
    .filter(result => result !== undefined);
  if (nestedResults.length > 0) {
    return nestedResults[0];
  } else {
    return undefined;
  }
};

export const useLinkedInteractivesAuthoring = ({ linkedInteractiveProps, schema }: IProps) => {
  // This hook provides two separate features in fact. But it doesn't make sense to use one without another,
  // so it's all provided as one hook.
  useLinkedInteractivesInAuthoredState(linkedInteractiveProps);
  return useLinkedInteractivesInSchema(schema, linkedInteractiveProps);
};

// Handle authored state update. Each time one of the linked interactive properties is updated, send updated
// linkedInteractives array to LARA parent window. currentLinkedInteractives acts only as a cache, so we don't
// send the message each time the authoredState is updated (e.g. its other, unrelated fields).
const useLinkedInteractivesInAuthoredState = (linkedInteractiveProps?: ILinkedInteractiveProp[]) => {
  const initMessage = useContextInitMessage();
  const [ cachedLinkedInteractives, setCachedLinkedInteractives ] = useState<ILinkedInteractive[]>();
  const { authoredState } = useAuthoredState<AuthoredState>();
  const previousAuthoredState = usePrevious<AuthoredState | null>(authoredState, null);

  // Note that initMessage.linkedInteractives is never updated, even after setLinkedInteractives is sent.
  // So, cachedLinkedInteractives is used to keep the most recent value after updates.
  const currentLinkedInteractives = cachedLinkedInteractives || (initMessage?.mode === "authoring" && initMessage?.linkedInteractives) || emptyArray;

  useEffect(() => {
    if (linkedInteractiveProps && previousAuthoredState && authoredState && initMessage?.mode === "authoring") {
      let newArray: ILinkedInteractive[] | null = null;
      let anyUpdate = false;
      linkedInteractiveProps.forEach(li => {
        const name = li.label;
        const authoredStateVal = authoredState[name];
        if (authoredStateVal === previousAuthoredState[name]) {
          // Do nothing, the value hasn't changed between renders.
          // This is very important, as it'll prevent overwriting linkedInteractives on the initial load.
          return;
        }
        const linkedInteractive = currentLinkedInteractives.find((l: ILinkedInteractive) => l.label === name);
        if (!linkedInteractive && authoredStateVal !== undefined) {
          // Add a new item.
          newArray = [...currentLinkedInteractives, {
            id: authoredStateVal,
            label: name
          }];
          anyUpdate = true;
        } else if (linkedInteractive && authoredStateVal === undefined) {
          // Remove item from the array.
          newArray = currentLinkedInteractives.filter((int: ILinkedInteractive) => int.id !== linkedInteractive.id);
          anyUpdate = true;
        } else if (linkedInteractive && linkedInteractive.id !== authoredStateVal) {
          // Update array item.
          newArray = [...currentLinkedInteractives.filter((int: ILinkedInteractive) => int.id !== linkedInteractive.id), {
            id: authoredStateVal,
            label: name
          }];
          anyUpdate = true;
        }
      });
      if (anyUpdate && newArray) {
        setCachedLinkedInteractives(newArray); // Set cached value
        setLinkedInteractives({linkedInteractives: newArray}); // Send to LARA
      }
    }
  }, [authoredState, previousAuthoredState, cachedLinkedInteractives, currentLinkedInteractives, initMessage?.mode, linkedInteractiveProps]);
};

// Get the list of interactives that are on the same page.
const useLinkedInteractivesInSchema = (schema: RJSFSchema, linkedInteractiveProps?: ILinkedInteractiveProp[]) => {
  const initMessage = useContextInitMessage();
  const [ interactiveList, setInteractiveList ] = useState<{[label: string]: {names: string[], ids: string[]}}>({});

  const interactiveItemId = initMessage?.mode === "authoring" && initMessage.interactiveItemId;
  useEffect(() => {
    if (linkedInteractiveProps && initMessage?.mode === "authoring") {
      linkedInteractiveProps.forEach(li => {
        getInteractiveList({scope: "page", supportsSnapshots: li.supportsSnapshots}).then(response => {
          const otherInteractives = response.interactives.filter(int => int.id !== interactiveItemId);
          const ids = otherInteractives.map(int => int.id);
          const names = otherInteractives.map(int => int.name ? `${int.id} (${int.name})` : int.id);
          setInteractiveList(prevIntList => Object.assign({}, prevIntList, {[li.label]: {names, ids}}));
        });
      });
    }
  }, [initMessage?.mode, interactiveItemId, linkedInteractiveProps, schema?.properties]);

  // Generate new schema with the list of interactives.
  const schemaWithInteractives = deepmerge({}, schema); // deep clone using deepmerge
  linkedInteractiveProps?.forEach(li => {
    const name = li.label;
    // Why nested object? Property can be either in the schema top-level or nested within other properties
    // or dependency tree.
    const propDefinition = getNestedObject(schemaWithInteractives, name);
    if (propDefinition) {
      propDefinition.enum = interactiveList[name]?.ids.length ? interactiveList[name]?.ids : ["none"];
      propDefinition.enumNames = interactiveList[name]?.names.length ? interactiveList[name]?.names : ["No linked interactives available"];
    }
  });

  return schemaWithInteractives;
};
