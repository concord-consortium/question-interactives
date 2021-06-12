import { IDataset, IInitInteractive, IInteractiveStateWithDataset, inIframe } from "@concord-consortium/lara-interactive-api";
import { useEffect, useRef, useState } from "react";
import { IAuthoredState, IDroppedItem, IDropZone } from "../components/types";
import * as iframePhone from "iframe-phone";

export type IInitInteractiveData = IInitInteractive<IInteractiveStateWithDataset, IAuthoredState>;

interface IInteractiveStateJSON extends IInteractiveStateWithDataset {
  targetData: IDropZone;
  droppedItemData: IDroppedItem;
  mode: "runtime" | "report"
}

export const useInteractiveApi = () => {
  const phone = useRef<any>();
  // const [connectedToLara, setConnectedToLara] = useState(false);
  const [initInteractiveData, setInitInteractiveData] = useState<IInitInteractiveData | undefined>(undefined);
  const dataset = useRef<IDataset | null>(null);

  const setHeight = (height: number) => {
    phone.current?.post("height", height);
  };

  const sendCurrentInteractiveState = () => {
    const intState: IInteractiveStateWithDataset = {
      dataset: dataset.current
    };
    phone.current?.post('interactiveState', intState);
  };

  const setDataset = (newDataset: IDataset | null) => {
    dataset.current = newDataset;
    sendCurrentInteractiveState();
  };

  useEffect(() => {
    if (inIframe()) {
        // create iframephone and wait for initInteractive
      const _phone = iframePhone.getIFrameEndpoint();
      phone.current = _phone;

      _phone.addListener("initInteractive", (data: IInitInteractiveData) => {
        // setConnectedToLara(true);

        let interactiveState: IInitInteractiveData | undefined;

        if (data.mode === "runtime" || data.mode === "report") {
          try {
            // as any is necessary, as IInitInteractive apparently doesn't assume that interactiveState can be a string.
            // It might be here for historical reasons, or report environments might pass interactive state as string.
            const rawInteractiveState: IInitInteractiveData | string | undefined = data.interactiveState as any;
            interactiveState = typeof rawInteractiveState === "string" ?
              JSON.parse(rawInteractiveState) : rawInteractiveState;
          } catch (e) {
            // JSON.parse has failed. That's fine, just empty or malformed interactive state.
          }
        }

        setInitInteractiveData(data);
      });

      _phone.addListener('getInteractiveState', sendCurrentInteractiveState);

      _phone.initialize();

      _phone.post("supportedFeatures", {
        apiVersion: 1,
        features: {
          interactiveState: true,
          authoredState: true
        }
      });
    }
  }, []);

  return {
    initInteractiveData, phone: phone.current, setHeight, setDataset
  };
};
