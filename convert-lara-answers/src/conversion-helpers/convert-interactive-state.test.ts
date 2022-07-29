import { convertInteractiveState } from "./convert-interactive-state";
import { ILARAAnonymousAnswerReportHash, ILARAAnswerReportHash, ILARAInteractiveRunStateReportHash } from "../types";

jest.mock("@google-cloud/firestore", () => ({
  ...jest.requireActual("@google-cloud/firestore"),
  Timestamp: {
    now: () => "Wed, 20 Jul 2022 12:12:12 UTC"
  }
}));

const newQuestion = {
  id: "managed_interactive_448816",
  ref_id: "448816-ManagedInteractive",
  authored_state: { authoredProp: "value" }
};

const laraAnswerLoggedIn: ILARAAnswerReportHash & ILARAInteractiveRunStateReportHash = {
  report_state: '{"version":1,"mode":"report","authoredState":null,"interactiveState":"{\\"data\\":[[\\"a\\",\\"Table\\",\\"that\\",\\"saves\\"],[\\"b\\",null,\\"state\\",null],[\\"c\\",null,null,null]]}"}',
  question_type: 'iframe_interactive',
  submitted: null,
  tool_user_id: '1406',
  id: 'interactive_run_state_78721',
  answer: '{"version":1,"mode":"report","authoredState":null,"interactiveState":"{\\"data\\":[[\\"a\\",\\"Table\\",\\"that\\",\\"saves\\"],[\\"b\\",null,\\"state\\",null],[\\"c\\",null,null,null]]}"}',
  type: 'interactive_state',
  resource_link_id: '2462',
  remote_endpoint: 'https://learn.staging.concord.org/dataservice/external_activity_data/933e2f3f-13b2-4119-b3b9-97485aaa8c58',
  tool_id: 'https://authoring.staging.concord.org',
  class_info_url: 'https://learn.staging.concord.org/api/v1/classes/32',
  run_key: '19bfcb93-ccbf-4f53-84a7-296294821954',
  question_id: 'mw_interactive_212649',
  platform_user_id: '147',
  context_id: '471ca0f6c36b66704e542611b67d8cb52b56437538c6242c',
  platform_id: 'https://learn.staging.concord.org',
  version: '1',
  created: '2022-07-25 13:32:00 UTC',
  resource_url: 'https://authoring.staging.concord.org/activities/21639',
  source_key: 'authoring.staging.concord.org',
  answer_text: null
};

const laraAnswerAnonymous: ILARAAnonymousAnswerReportHash & ILARAInteractiveRunStateReportHash = {
  version: '1',
  question_id: 'mw_interactive_210348',
  resource_url: 'https://authoring.staging.concord.org/activities/20624',
  class_info_url: null,
  report_state: '{"version":1,"mode":"report","authoredState":null,"interactiveState":"{\\"version\\":1,\\"exercises\\":{\\"summary\\":{\\"current\\":\\"# Get summary statistics for the \\\\\\"reusable_trays\\\\\\" data set \\\\nsummary(reusable_trays)\\\\n\\",\\"submitted\\":\\"\\"}},\\"lara_options\\":{\\"reporting_url\\":\\"https://concord.shinyapps.io/reus_summary/\\"}}"}',
  platform_id: null,
  source_key: 'authoring.staging.concord.org',
  tool_id: 'https://authoring.staging.concord.org',
  answer_text: null,
  run_key: '6613df87-efa7-4286-9c88-7ba738c2d9e7',
  platform_user_id: '6613df87-efa7-4286-9c88-7ba738c2d9e7',
  remote_endpoint: null,
  resource_link_id: null,
  context_id: null,
  answer: '{"version":1,"mode":"report","authoredState":null,"interactiveState":"{\\"version\\":1,\\"exercises\\":{\\"summary\\":{\\"current\\":\\"# Get summary statistics for the \\\\\\"reusable_trays\\\\\\" data set \\\\nsummary(reusable_trays)\\\\n\\",\\"submitted\\":\\"\\"}},\\"lara_options\\":{\\"reporting_url\\":\\"https://concord.shinyapps.io/reus_summary/\\"}}"}',
  created: '2021-10-13 16:22:45 UTC',
  id: 'interactive_run_state_62278',
  question_type: 'iframe_interactive',
  submitted: null,
  tool_user_id: '2372',
  type: 'interactive_state'
};

describe("convert interactive state", () => {
  it("copies all the expected fields of the logged in variant of the answer", () => {
    const result = convertInteractiveState({
      oldAnswer: laraAnswerLoggedIn,
      newQuestion,
      oldSourceKey: "authoring.concord.org",
      newSourceKey: "activity-player.concord.org",
      additionalMetadata: {}
    });

    expect(result).toEqual({
      report_state: '{"version":1,"mode":"report","authoredState":null,"interactiveState":"{\\"data\\":[[\\"a\\",\\"Table\\",\\"that\\",\\"saves\\"],[\\"b\\",null,\\"state\\",null],[\\"c\\",null,null,null]]}"}',
      question_type: 'iframe_interactive',
      submitted: null,
      tool_user_id: '1406',
      id: 'converted-authoring.concord.org-answers-interactive_run_state_78721',
      answer: '{"version":1,"mode":"report","authoredState":null,"interactiveState":"{\\"data\\":[[\\"a\\",\\"Table\\",\\"that\\",\\"saves\\"],[\\"b\\",null,\\"state\\",null],[\\"c\\",null,null,null]]}"}',
      type: 'interactive_state',
      resource_link_id: '2462',
      remote_endpoint: 'https://learn.staging.concord.org/dataservice/external_activity_data/933e2f3f-13b2-4119-b3b9-97485aaa8c58',
      tool_id: 'activity-player.concord.org',
      class_info_url: 'https://learn.staging.concord.org/api/v1/classes/32',
      run_key: '19bfcb93-ccbf-4f53-84a7-296294821954',
      question_id: 'managed_interactive_448816',
      platform_user_id: '147',
      context_id: '471ca0f6c36b66704e542611b67d8cb52b56437538c6242c',
      platform_id: 'https://learn.staging.concord.org',
      version: 1,
      created: '2022-07-25 13:32:00 UTC',
      resource_url: 'https://authoring.staging.concord.org/activities/21639',
      source_key: 'activity-player.concord.org',
      answer_text: null,
      convertedFrom: 'authoring.concord.org/answers/interactive_run_state_78721',
      convertedAt: 'Wed, 20 Jul 2022 12:12:12 UTC'
    });

    const reportState = JSON.parse(result.report_state);
    expect(() => JSON.parse(reportState.authoredState)).not.toThrowError();
    expect(() => JSON.parse(reportState.interactiveState)).not.toThrowError();
  });

  it("copies all the expected fields of the anonymous variant of the answer", () => {
    const result = convertInteractiveState({
      oldAnswer: laraAnswerAnonymous,
      newQuestion,
      oldSourceKey: "authoring.concord.org",
      newSourceKey: "activity-player.concord.org",
      additionalMetadata: {}
    });

    expect(result).toEqual({
      version: 1,
      question_id: 'managed_interactive_448816',
      resource_url: 'https://authoring.staging.concord.org/activities/20624',
      class_info_url: null,
      report_state: '{"version":1,"mode":"report","authoredState":null,"interactiveState":"{\\"version\\":1,\\"exercises\\":{\\"summary\\":{\\"current\\":\\"# Get summary statistics for the \\\\\\"reusable_trays\\\\\\" data set \\\\nsummary(reusable_trays)\\\\n\\",\\"submitted\\":\\"\\"}},\\"lara_options\\":{\\"reporting_url\\":\\"https://concord.shinyapps.io/reus_summary/\\"}}"}',
      platform_id: null,
      source_key: 'activity-player.concord.org',
      tool_id: 'activity-player.concord.org',
      answer_text: null,
      run_key: '6613df87-efa7-4286-9c88-7ba738c2d9e7',
      platform_user_id: '6613df87-efa7-4286-9c88-7ba738c2d9e7',
      remote_endpoint: null,
      resource_link_id: null,
      context_id: null,
      answer: '{"version":1,"mode":"report","authoredState":null,"interactiveState":"{\\"version\\":1,\\"exercises\\":{\\"summary\\":{\\"current\\":\\"# Get summary statistics for the \\\\\\"reusable_trays\\\\\\" data set \\\\nsummary(reusable_trays)\\\\n\\",\\"submitted\\":\\"\\"}},\\"lara_options\\":{\\"reporting_url\\":\\"https://concord.shinyapps.io/reus_summary/\\"}}"}',
      created: '2021-10-13 16:22:45 UTC',
      id: 'converted-authoring.concord.org-answers-interactive_run_state_62278',
      question_type: 'iframe_interactive',
      submitted: null,
      // tool_user_id is intentionally converted to "anonymous", even if LARA provided it for an anonymous run.
      // See: https://concord-consortium.slack.com/archives/C0M5CM1RA/p1658831435454769
      tool_user_id: 'anonymous',
      type: 'interactive_state',
      convertedFrom: 'authoring.concord.org/answers/interactive_run_state_62278',
      convertedAt: 'Wed, 20 Jul 2022 12:12:12 UTC'
    });

    const reportState = JSON.parse(result.report_state);
    expect(() => JSON.parse(reportState.authoredState)).not.toThrowError();
    expect(() => JSON.parse(reportState.interactiveState)).not.toThrowError();
  });
});
