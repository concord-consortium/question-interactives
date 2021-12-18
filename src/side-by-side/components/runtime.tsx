import React, { useCallback, useState } from "react";
import { IframeRuntime } from "../../shared/components/iframe-runtime";
import { IAuthoredState, IInteractiveState } from "./types";
import { renderHTML } from "../../shared/utilities/render-html";
import { libraryInteractiveIdToUrl } from "../../shared/utilities/library-interactives";
import { IAddLinkedInteractiveStateListenerRequest } from "@concord-consortium/lara-interactive-api";
import { IframePhone } from "../../shared/types";

import css from "./runtime.scss";

interface IProps {
  authoredState: IAuthoredState;
  interactiveState?: IInteractiveState | null;
  setInteractiveState?: (updateFunc: (prevState: IInteractiveState | null) => IInteractiveState) => void;
}

export const Runtime: React.FC<IProps> = ({ authoredState, interactiveState, setInteractiveState }) => {

  const { prompt, leftInteractive, rightInteractive, division } = authoredState;
  const [dataListeners, setDataListeners] = useState<{id: string, phone: IframePhone}[]>([]);

  const handleAddLocalLinkedDataListener = useCallback((request: IAddLinkedInteractiveStateListenerRequest, phone: IframePhone) => {
    setDataListeners(listeners => [...listeners, {id: request.listenerId, phone}]);
  }, []);

  if (!leftInteractive && !rightInteractive) {
    return <div>No sub items available. Please add them using the authoring interface.</div>;
  }

  type InteractiveStateSide = "leftInteractiveState" | "rightInteractiveState";

  const handleNewInteractiveState = (interactiveStateSide: InteractiveStateSide, newInteractiveState: any) => {
    setInteractiveState?.((prevState: IInteractiveState) => {
      if (newInteractiveState.dataset && dataListeners.length > 0) {
        dataListeners.forEach(listener => {
          listener.phone.post("linkedInteractiveState", {
            listenerId: listener.id,
            interactiveState: newInteractiveState
          });
        });
      }
      return {
        ...prevState,
        [interactiveStateSide]: newInteractiveState
      };
    });
  };

  return (
    <div>
      { prompt &&
      <div>{renderHTML(prompt)}</div> }
      <div className={css.split} style={{gridTemplateColumns: `${division}% ${100 - division}%`}}>
        { leftInteractive &&
        <div className={css.runtime}>
            <IframeRuntime
              id={leftInteractive.id}
              url={libraryInteractiveIdToUrl(leftInteractive.libraryInteractiveId, "side-by-side")}
              authoredState={leftInteractive.authoredState}
              interactiveState={interactiveState?.leftInteractiveState}
              // logRequestData={logRequestData}
              setInteractiveState={handleNewInteractiveState.bind(null, "leftInteractiveState")}
              addLocalLinkedDataListener={handleAddLocalLinkedDataListener}
            />
        </div> }
        { rightInteractive &&
        <div className={css.runtime}>
            <IframeRuntime
              id={rightInteractive.id}
              url={libraryInteractiveIdToUrl(rightInteractive.libraryInteractiveId, "side-by-side")}
              authoredState={rightInteractive.authoredState}
              interactiveState={interactiveState?.leftInteractiveState}
              // logRequestData={logRequestData}
              setInteractiveState={handleNewInteractiveState.bind(null, "rightInteractiveState")}
              addLocalLinkedDataListener={handleAddLocalLinkedDataListener}
            />
        </div> }
      </div>
    </div>
  );
};