import * as React from "react";
import { useEffect } from "react";
import * as semver from "semver";
import { IReportItemInitInteractive,
         addGetReportItemAnswerListener,
         sendReportItemAnswer,
         getClient,
         IReportItemAnswerItem } from "@concord-consortium/lara-interactive-api";
import { IAuthoredState, IInteractiveState } from "../types";

interface Props {
  initMessage: IReportItemInitInteractive;
}

export const ReportItemComponent: React.FC<Props> = (props) => {

  useEffect(() => {
    addGetReportItemAnswerListener<IInteractiveState, IAuthoredState>((request) => {
      const {platformUserId, version} = request;

      if (!version) {
        // for hosts sending older, unversioned requests
        // tslint:disable-next-line:no-console
        console.error("ScoreBOT Report Item Interactive: Missing version in getReportItemAnswer request.");
      }
      else if (semver.satisfies(version, "2.x")) {
        const items: IReportItemAnswerItem[] = [];
        items.push({type: "answerText"});
        sendReportItemAnswer({version, platformUserId, items});
      } else {
        // tslint:disable-next-line:no-console
        console.error(
          "ScoreBOT Report Item Interactive: Unsupported version in getReportItemAnswer request:",
          version
        );
      }
    });

    getClient().post("reportItemClientReady");
  });

  return (null);
};
