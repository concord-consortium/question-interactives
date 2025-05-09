import * as React from "react";
import { useInitMessage, useAutoSetHeight, IReportItemInitInteractive, useReportItem } from "@concord-consortium/lara-interactive-api";
import { reportItemHandler } from "./report-item";
import { IAuthoredState, IInteractiveState } from "../types";

interface Props {}

export const AppComponent: React.FC<Props> = (props) => {
  const initMessage = useInitMessage<IReportItemInitInteractive<Record<string, unknown>, Record<string, unknown>>, Record<string, unknown>>();

  useAutoSetHeight();

  useReportItem<IInteractiveState, IAuthoredState>({
    metadata: {
      compactAnswerReportItemsAvailable: true
    },
    handler: reportItemHandler
  });

  if (!initMessage) {
    return (
      <div className="centered">
        <div className="progress">
          Loading...
        </div>
      </div>
    );
  }

  if (initMessage.mode !== "reportItem") {
    return (
      <div>
        <h1>Oops!</h1>
        <p>
        ¯\_(ツ)_/¯
        </p>
        <p>
          This interactive is only available in &apos;reportItem&apos; mode but &apos;{initMessage.mode}&apos; was given.
        </p>
      </div>
    );
  }

  return null;
};
