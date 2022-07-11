import * as React from "react";
import * as semver from "semver";
import {
  IReportItemInitInteractive, sendReportItemAnswer, IReportItemAnswerItem, useReportItem
  } from "@concord-consortium/lara-interactive-api";
import { IAuthoredState, IInteractiveState } from "../types";

interface Props {
  initMessage: IReportItemInitInteractive;
}

export const ReportItemComponent: React.FC<Props> = (props) => {
  useReportItem<IInteractiveState, IAuthoredState>({
    metadata: {
      compactAnswerReportItemsAvailable: false
    },
    handler: (request) => {
      const {interactiveState, platformUserId, version} = request;

      if (!version) {
        // for hosts sending older, unversioned requests
        // tslint:disable-next-line:no-console
        console.error("Open Response Report Item Interactive: Missing version in getReportItemAnswer request.");
      }
      else if (semver.satisfies(version, "2.x")) {
        const items: IReportItemAnswerItem[] = [];
        const { audioFile } = interactiveState as IInteractiveState;
        if (audioFile) {
          items.push({type: "attachment", name: audioFile});
        }
        items.push({type: "answerText"});
        sendReportItemAnswer({version, platformUserId, items});
      } else {
        // tslint:disable-next-line:no-console
        console.error(
          "Open Response Report Item Interactive: Unsupported version in getReportItemAnswer request:",
          version
        );
      }
    }
  });

  return null;
};
