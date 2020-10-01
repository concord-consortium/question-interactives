import { useEffect, useState } from "react";
import deepmerge from "deepmerge";
import { JSONSchema6 } from "json-schema";
import {
  useAuthoredState, useInitMessage, getInteractiveList, ILinkedInteractive, setLinkedInteractives
} from "@concord-consortium/lara-interactive-api";

export interface ILinkedInteractiveProp {
  label: string;
  supportsSnapshots?: boolean;
}

export interface IProps {
  linkedInteractiveProps?: ILinkedInteractiveProp[];
  schema: JSONSchema6;
}

type AuthoredState = Record<string, any>;
const emptyArray: ILinkedInteractive[] = [];


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
  const initMessage = useInitMessage<AuthoredState>();
  const [ cachedLinkedInteractives, setCachedLinkedInteractives ] = useState<ILinkedInteractive[]>();
  const { authoredState } = useAuthoredState<AuthoredState>();

  // Note that initMessage.linkedInteractives is never updated, even after setLinkedInteractives is sent.
  // So, cachedLinkedInteractives is used to keep the most recent value after updates.
  const currentLinkedInteractives = cachedLinkedInteractives || (initMessage?.mode === "authoring" && initMessage?.linkedInteractives) || emptyArray;

  useEffect(() => {
    if (linkedInteractiveProps && authoredState && initMessage?.mode === "authoring") {
      let newArray: ILinkedInteractive[] | null = null;
      let anyUpdate = false;
      linkedInteractiveProps.forEach(li => {
        const name = li.label;
        const authoredStateVal = authoredState[name];
        const linkedInteractive = currentLinkedInteractives.find(l => l.label === name);
        if (!linkedInteractive && authoredStateVal !== undefined) {
          // Add a new item.
          newArray = [...currentLinkedInteractives, {
            id: authoredStateVal,
            label: name
          }];
          anyUpdate = true;
        } else if (linkedInteractive && authoredStateVal === undefined) {
          // Remove item from the array.
          newArray = currentLinkedInteractives.filter(int => int.id !== linkedInteractive.id);
          anyUpdate = true;
        } else if (linkedInteractive && linkedInteractive.id !== authoredStateVal) {
          // Update array item.
          newArray = [...currentLinkedInteractives.filter(int => int.id !== linkedInteractive.id), {
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
  }, [authoredState, cachedLinkedInteractives, currentLinkedInteractives, initMessage?.mode, linkedInteractiveProps]);
};

// Get the list of interactives that are on the same page.
const useLinkedInteractivesInSchema = (schema: JSONSchema6, linkedInteractiveProps?: ILinkedInteractiveProp[]) => {
  const initMessage = useInitMessage<AuthoredState>();
  const [ interactiveList, setInteractiveList ] = useState<{[label: string]: {names: string[], ids: string[]}}>({});

  const interactiveItemId = initMessage?.mode === "authoring" && initMessage.interactiveItemId;
  useEffect(() => {
    if (linkedInteractiveProps && initMessage?.mode === "authoring") {
      linkedInteractiveProps.forEach(li => {
        const name = li.label;
        if (schema?.properties?.[name]) {
          getInteractiveList({scope: "page", supportsSnapshots: li.supportsSnapshots}).then(response => {
            const otherInteractives = response.interactives.filter(int => int.id !== interactiveItemId);
            const ids = otherInteractives.map(int => int.id);
            const names = otherInteractives.map(int => int.name ? `${int.id} (${int.name})` : int.id);
            setInteractiveList(prevIntList => Object.assign({}, prevIntList, {[li.label]: {names, ids}}));
          });
        }
      });
    }
  }, [initMessage?.mode, interactiveItemId, linkedInteractiveProps, schema?.properties]);

  // Generate new schema with interactives list.
  let schemaWithInteractives = schema;
  linkedInteractiveProps?.forEach(li => {
    const name = li.label;
    if (schema?.properties?.[name]) {
      schemaWithInteractives = deepmerge(schemaWithInteractives, {
        properties: {
          [name]: {
            enum: interactiveList[name]?.ids,
            enumNames: interactiveList[name]?.names
          }
        }
      });
    }
  });

  return schemaWithInteractives;
};
