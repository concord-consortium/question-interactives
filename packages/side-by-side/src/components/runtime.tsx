import React, { useCallback, useEffect, useState } from "react";
import { IframeRuntime } from "@concord-consortium/question-interactives-helpers/src/components/iframe-runtime";
import { renderHTML } from "@concord-consortium/question-interactives-helpers/src/utilities/render-html";
import { libraryInteractiveIdToUrl } from "@concord-consortium/question-interactives-helpers/src/utilities/library-interactives";
import { IAddLinkedInteractiveStateListenerRequest } from "@concord-consortium/lara-interactive-api";
import { IframePhone } from "@concord-consortium/question-interactives-helpers/src/types";
import { DynamicText } from "@concord-consortium/dynamic-text";

import { IAuthoredState, IInteractiveState } from "./types";
import { useFontSize } from "@concord-consortium/question-interactives-helpers/src/hooks/use-font-size";

import css from "./runtime.scss";

interface IProps {
  authoredState: IAuthoredState;
  interactiveState?: IInteractiveState | null;
  setInteractiveState?: (updateFunc: (prevState: IInteractiveState | null) => IInteractiveState) => void;
  report?: boolean;
  view?: "standalone";
}

export const Runtime: React.FC<IProps> = ({ authoredState, interactiveState, setInteractiveState, report, view }) => {

  const { prompt, leftInteractive, rightInteractive, division } = authoredState;
  const [dataListeners, setDataListeners] = useState<{id: string, phone: IframePhone}[]>([]);
  const leftDivision = division;
  const rightDivision = 100 - division;

  const fontSize = useFontSize();

  const updateDataListeners = useCallback((newInteractiveState: any) => {
    dataListeners.forEach(listener => {
      listener.phone.post("linkedInteractiveState", {
        listenerId: listener.id,
        interactiveState: newInteractiveState
      });
    });
  }, [dataListeners]);

  useEffect(() => {
    if (interactiveState?.leftInteractiveState?.dataset) {
      updateDataListeners(interactiveState.leftInteractiveState);
    }
    if (interactiveState?.rightInteractiveState?.dataset) {
      updateDataListeners(interactiveState.rightInteractiveState);
    }
  },
  [interactiveState?.leftInteractiveState, interactiveState?.rightInteractiveState, updateDataListeners]);

  const handleAddLocalLinkedDataListener = useCallback((request: IAddLinkedInteractiveStateListenerRequest, phone: IframePhone) => {
    setDataListeners(listeners => [...listeners, {id: request.listenerId, phone}]);
  }, []);

  if (!leftInteractive && !rightInteractive) {
    return <div>No sub items available. Please add them using the authoring interface.</div>;
  }

  type InteractiveStateSide = "leftInteractiveState" | "rightInteractiveState";

  // TODO: Type newInteractiveState and whatever calls handleNewInteractiveState better.
  // It is possible that newInteractiveState could be a string which might cause an error
  // since it would not be undefined but would not have a dataset property.
  const handleNewInteractiveState = (interactiveStateSide: InteractiveStateSide, newInteractiveState: any) => {
    setInteractiveState?.((prevState: IInteractiveState) => {
      if (newInteractiveState?.dataset && dataListeners.length > 0) {
        updateDataListeners(newInteractiveState);
      }
      return {
        ...prevState,
        [interactiveStateSide]: newInteractiveState
      };
    });
  };

  const availableWidth = window.innerWidth - 40;
  const availableWidthLeft = availableWidth * (leftDivision * .01);
  const availableWidthRight = availableWidth * (rightDivision * .01);
  const scaleForReportLeft = availableWidthLeft < 600 ? availableWidthLeft/600 : 1;
  const scaleForReportRight = availableWidthRight < 600 ? availableWidthRight/600 : 1;

  return (
    <div>
      { (!report || view === "standalone") && prompt &&
        <div><DynamicText>{renderHTML(prompt)}</DynamicText></div>
      }
      <div className={css.split} style={{gridTemplateColumns: `${leftDivision}% ${rightDivision}%`}}>
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
              report={report}
              scale={report && view !== "standalone" ? scaleForReportLeft : undefined}
              initMessage={{fontSize} as any}
            />
        </div> }
        { rightInteractive &&
        <div className={css.runtime}>
            <IframeRuntime
              id={rightInteractive.id}
              url={libraryInteractiveIdToUrl(rightInteractive.libraryInteractiveId, "side-by-side")}
              authoredState={rightInteractive.authoredState}
              interactiveState={interactiveState?.rightInteractiveState}
              // logRequestData={logRequestData}
              setInteractiveState={handleNewInteractiveState.bind(null, "rightInteractiveState")}
              addLocalLinkedDataListener={handleAddLocalLinkedDataListener}
              report={report}
              scale={report && view !== "standalone" ? scaleForReportRight : undefined}
              initMessage={{fontSize} as any}
            />
        </div> }
      </div>
    </div>
  );
};
