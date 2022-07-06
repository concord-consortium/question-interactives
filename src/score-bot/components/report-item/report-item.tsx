import * as React from "react";
import { useEffect } from "react";
import * as semver from "semver";
import { IReportItemInitInteractive, addGetReportItemAnswerListener, sendReportItemAnswer, getClient,
  IReportItemAnswerItem } from "@concord-consortium/lara-interactive-api";
import { IAuthoredState, IInteractiveState } from "../types";
import { renderStyledComponentToString } from "../../../shared/utilities/render-styled-component-to-string";
import { FeedbackReport } from "./feedback-report";
import { getLastFeedback, getLastScore, getMaxScore, getNumberOfAttempts, isFeedbackOutdated } from "../../utils";

interface Props {
  initMessage: IReportItemInitInteractive;
}

export const ReportItemComponent: React.FC<Props> = (props) => {

  useEffect(() => {
    addGetReportItemAnswerListener<IInteractiveState, IAuthoredState>((request) => {
      const {interactiveState, authoredState, platformUserId, version} = request;

      if (!version) {
        // for hosts sending older, unversioned requests
        // tslint:disable-next-line:no-console
        console.error("ScoreBOT Report Item Interactive: Missing version in getReportItemAnswer request.");
      }
      else if (semver.satisfies(version, "2.x")) {
        const items: IReportItemAnswerItem[] = [];
        // This item intentionally doesn't include answer text. Answer text is obtained by portal report itself
        // and preloaded while it's waiting for report items response.
        items.push({ type: "answerText" });

        const score = getLastScore(interactiveState);
        const maxScore = getMaxScore(authoredState);
        const attempts = getNumberOfAttempts(interactiveState);
        const feedback = getLastFeedback(authoredState, interactiveState);
        const isOutdated = isFeedbackOutdated(interactiveState);
        const feedbackHtml = renderStyledComponentToString(
          <FeedbackReport score={score} maxScore={maxScore} attempts={attempts} feedback={feedback} outdated={isOutdated} />,
        );
        items.push({ type: "html", html: feedbackHtml });

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
