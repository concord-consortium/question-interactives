import * as semver from "semver";
import { sendReportItemAnswer, IReportItemAnswerItem, IGetReportItemAnswerHandler } from "@concord-consortium/lara-interactive-api";
import { IAuthoredState, IInteractiveState } from "../types";

export const reportItemHandler: IGetReportItemAnswerHandler<IInteractiveState, IAuthoredState> = request => {
  const {platformUserId, version, itemsType} = request;

  if (!version) {
    // for hosts sending older, unversioned requests
    // tslint:disable-next-line:no-console
    console.error("Open Response Report Item Interactive: Missing version in getReportItemAnswer request.");
  }
  else if (semver.satisfies(version, "2.x")) {
    const items: IReportItemAnswerItem[] = [];

    // TODO: add items to report

    sendReportItemAnswer({version, platformUserId, items, itemsType});
  } else {
    // tslint:disable-next-line:no-console
    console.error(
      "Open Response Report Item Interactive: Unsupported version in getReportItemAnswer request:",
      version
    );
  }
};
