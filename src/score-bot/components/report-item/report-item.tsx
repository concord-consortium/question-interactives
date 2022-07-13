import * as React from "react";
import * as semver from "semver";
import {
  IReportItemInitInteractive, sendReportItemAnswer, IReportItemAnswerItem, useReportItem
} from "@concord-consortium/lara-interactive-api";
import { IAuthoredState, IInteractiveState } from "../types";
import { renderStyledComponentToString } from "../../../shared/utilities/render-styled-component-to-string";
import { FeedbackReport } from "./feedback-report";
import { getLastFeedback, getLastScore, getMaxScore, getNumberOfAttempts, isFeedbackOutdated } from "../../utils";

interface Props {
  initMessage: IReportItemInitInteractive;
}

export const ReportItemComponent: React.FC<Props> = (props) => {
  useReportItem<IInteractiveState, IAuthoredState>({
    metadata: {
      compactAnswerReportItemsAvailable: true
    },
    handler: request => {
      const { interactiveState, authoredState, platformUserId, version, itemsType } = request;

      if (!version) {
        // for hosts sending older, unversioned requests
        // tslint:disable-next-line:no-console
        console.error("ScoreBOT Report Item Interactive: Missing version in getReportItemAnswer request.");
      }
      else if (semver.satisfies(version, "2.x")) {
        const items: IReportItemAnswerItem[] = [];

        if (itemsType === "fullAnswer") {
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
        }

        if (itemsType === "compactAnswer") {
          const score = getLastScore(interactiveState);
          const maxScore = getMaxScore(authoredState);
          if (score !== null && maxScore !== null) {
            items.push({ type: "score", score, maxScore });
          }
        }

        sendReportItemAnswer({version, platformUserId, items, itemsType});
      } else {
        // tslint:disable-next-line:no-console
        console.error(
          "ScoreBOT Report Item Interactive: Unsupported version in getReportItemAnswer request:",
          version
        );
      }
    }
  });

  return null;
};
