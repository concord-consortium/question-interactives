import { convertOpenResponse } from "./convert-open-response";
import { ILARAAnonymousAnswerReportHash, ILARAAnswerReportHash, ILARAOpenResponseAnswerReportHash } from "../types";

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

const laraAnswerLoggedIn: ILARAAnswerReportHash & ILARAOpenResponseAnswerReportHash = {
  source_key: 'authoring.staging.concord.org',
  resource_link_id: '2447',
  question_id: 'open_response_448816',
  tool_user_id: '1406',
  context_id: '471ca0f6c36b66704e542611b67d8cb52b56437538c6242c',
  question_type: 'open_response',
  class_info_url: 'https://learn.staging.concord.org/api/v1/classes/32',
  type: 'open_response_answer',
  run_key: '8ded3c35-08ca-4cfb-895f-b244f79449ac',
  platform_id: 'https://learn.staging.concord.org',
  platform_user_id: '147',
  tool_id: 'https://authoring.staging.concord.org',
  version: '1',
  resource_url: 'https://authoring.staging.concord.org/activities/21627',
  created: '2022-07-19 11:40:01 UTC',
  answer: 'LARA logged in user answer',
  id: 'open_response_answer_374971',
  submitted: false,
  remote_endpoint: 'https://learn.staging.concord.org/dataservice/external_activity_data/574fcb82-05bd-4634-8ef3-0a28b59ef47d'
};

const laraAnswerAnonymous: ILARAAnonymousAnswerReportHash & ILARAOpenResponseAnswerReportHash = {
  resource_link_id: null,
  context_id: null,
  resource_url: 'https://authoring.staging.concord.org/activities/21627',
  answer: 'LARA anonymous answer',
  tool_user_id: '',
  question_type: 'open_response',
  question_id: 'open_response_448816',
  id: 'open_response_answer_374973',
  submitted: false,
  tool_id: 'https://authoring.staging.concord.org',
  class_info_url: null,
  source_key: 'authoring.staging.concord.org',
  platform_id: null,
  run_key: '19c19f94-d19f-4cfa-a06a-76ef0b057355',
  version: '1',
  remote_endpoint: null,
  platform_user_id: '19c19f94-d19f-4cfa-a06a-76ef0b057355',
  created: '2022-07-20 12:13:17 UTC',
  type: 'open_response_answer'
};

describe("convert open response answer", () => {
  it("copies all the expected fields of the logged in variant of the answer", () => {
    const result = convertOpenResponse({
      oldAnswer: laraAnswerLoggedIn,
      newQuestion,
      oldSourceKey: "authoring.concord.org",
      newSourceKey: "activity-player.concord.org",
      additionalMetadata: {}
    });

    expect(result).toEqual({
      version: 1,
      id: 'converted-authoring.concord.org-answers-open_response_answer_374971',
      created: '2022-07-19 11:40:01 UTC',
      converted_from: 'authoring.concord.org/answers/open_response_answer_374971',
      converted_at: 'Wed, 20 Jul 2022 12:12:12 UTC',
      type: 'open_response_answer',
      answer: 'LARA logged in user answer',
      answer_text: 'LARA logged in user answer',
      class_info_url: "https://learn.staging.concord.org/api/v1/classes/32",
      submitted: false,
      report_state: '{"mode":"report","authoredState":"{\\"authoredProp\\":\\"value\\"}","interactiveState":"{\\"answerType\\":\\"open_response_answer\\",\\"answerText\\":\\"LARA logged in user answer\\",\\"submitted\\":false}","interactive":{"id":"managed_interactive_448816","name":""},"version":1}',
      question_id: 'managed_interactive_448816',
      question_type: 'open_response',
      platform_id: 'https://learn.staging.concord.org',
      platform_user_id: '147',
      context_id: '471ca0f6c36b66704e542611b67d8cb52b56437538c6242c',
      resource_link_id: '2447',
      resource_url: 'https://authoring.staging.concord.org/activities/21627',
      run_key: '8ded3c35-08ca-4cfb-895f-b244f79449ac',
      remote_endpoint: 'https://learn.staging.concord.org/dataservice/external_activity_data/574fcb82-05bd-4634-8ef3-0a28b59ef47d',
      source_key: 'activity-player.concord.org',
      tool_id: 'activity-player.concord.org/',
      tool_user_id: '1406',
      legacy_id: "open_response_answer_374971",
      legacy_question_id: "open_response_448816",
      legacy_question_type: "open_response",
    });

    const reportState = JSON.parse(result.report_state);
    expect(() => JSON.parse(reportState.authoredState)).not.toThrowError();
    expect(() => JSON.parse(reportState.interactiveState)).not.toThrowError();
  });

  it("copies all the expected fields of the anonymous variant of the answer", () => {
    const result = convertOpenResponse({
      oldAnswer: laraAnswerAnonymous,
      newQuestion,
      oldSourceKey: "authoring.concord.org",
      newSourceKey: "activity-player.concord.org",
      additionalMetadata: {}
    });

    expect(result).toEqual({
      version: 1,
      id: 'converted-authoring.concord.org-answers-open_response_answer_374973',
      created: '2022-07-20 12:13:17 UTC',
      converted_from: 'authoring.concord.org/answers/open_response_answer_374973',
      converted_at: 'Wed, 20 Jul 2022 12:12:12 UTC',
      type: 'open_response_answer',
      answer: 'LARA anonymous answer',
      answer_text: 'LARA anonymous answer',
      class_info_url: null,
      submitted: false,
      report_state: '{"mode":"report","authoredState":"{\\"authoredProp\\":\\"value\\"}","interactiveState":"{\\"answerType\\":\\"open_response_answer\\",\\"answerText\\":\\"LARA anonymous answer\\",\\"submitted\\":false}","interactive":{"id":"managed_interactive_448816","name":""},"version":1}',
      question_id: 'managed_interactive_448816',
      question_type: 'open_response',
      platform_id: null,
      platform_user_id: '19c19f94-d19f-4cfa-a06a-76ef0b057355',
      context_id: null,
      resource_link_id: null,
      resource_url: 'https://authoring.staging.concord.org/activities/21627',
      run_key: '19c19f94-d19f-4cfa-a06a-76ef0b057355',
      remote_endpoint: null,
      source_key: 'activity-player.concord.org',
      tool_id: 'activity-player.concord.org/',
      tool_user_id: 'anonymous',
      legacy_id: "open_response_answer_374973",
      legacy_question_id: "open_response_448816",
      legacy_question_type: "open_response",
    });

    const reportState = JSON.parse(result.report_state);
    expect(() => JSON.parse(reportState.authoredState)).not.toThrowError();
    expect(() => JSON.parse(reportState.interactiveState)).not.toThrowError();
  });
});
