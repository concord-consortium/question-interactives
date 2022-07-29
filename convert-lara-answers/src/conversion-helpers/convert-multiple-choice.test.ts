import { convertMultipleChoice } from "./convert-multiple-choice";
import { ILARAAnonymousAnswerReportHash, ILARAAnswerReportHash, ILARAMultipleChoiceAnswerReportHash } from "../types";

jest.mock("@google-cloud/firestore", () => ({
  ...jest.requireActual("@google-cloud/firestore"),
  Timestamp: {
    now: () => "Wed, 20 Jul 2022 12:12:12 UTC"
  }
}));

const newQuestion = {
  id: "managed_interactive_448816",
  ref_id: "448816-ManagedInteractive",
  authored_state: {
    choices: [
      {
        id: "50036",
        correct: true,
        content: "A"
      },
      {
        id: "1504",
        correct: false,
        content: "B"
      },
    ]
  }
};

const laraAnswerLoggedIn: ILARAAnswerReportHash & ILARAMultipleChoiceAnswerReportHash = {
  platform_id: 'https://learn.staging.concord.org',
  submitted: false,
  question_id: 'multiple_choice_13182',
  platform_user_id: '5625',
  id: 'multiple_choice_answer_198622',
  resource_link_id: '2445',
  tool_user_id: '2585',
  answer: { choice_ids: [ 50036 ] },
  run_key: '0618c718-a166-47a8-91ad-438675a7d2d3',
  created: '2022-07-18 17:28:24 UTC',
  version: '1',
  remote_endpoint: 'https://learn.staging.concord.org/dataservice/external_activity_data/2a9c96d0-99c0-4ac7-a7f2-efdd18ae28c2',
  context_id: '4395645d355d3a12dee5802cfaca87a840c1e629c887b8e8',
  question_type: 'multiple_choice',
  tool_id: 'https://authoring.staging.concord.org',
  type: 'multiple_choice_answer',
  class_info_url: 'https://learn.staging.concord.org/api/v1/classes/724',
  resource_url: 'https://authoring.staging.concord.org/activities/21094',
  source_key: 'authoring.staging.concord.org'
};

const laraAnswerAnonymous: ILARAAnonymousAnswerReportHash & ILARAMultipleChoiceAnswerReportHash = {
  platform_id: null,
  version: '1',
  class_info_url: null,
  remote_endpoint: null,
  tool_user_id: '',
  type: 'multiple_choice_answer',
  question_id: 'multiple_choice_405',
  source_key: 'authoring.staging.concord.org',
  resource_url: 'https://authoring.staging.concord.org/activities/84',
  tool_id: 'https://authoring.staging.concord.org',
  resource_link_id: null,
  platform_user_id: 'a9143ef0-7312-478b-a66b-3a189781b11c',
  submitted: false,
  answer: { choice_ids: [ 1504 ] },
  run_key: 'a9143ef0-7312-478b-a66b-3a189781b11c',
  created: '2021-10-12 20:29:32 UTC',
  context_id: null,
  id: 'multiple_choice_answer_100707',
  question_type: 'multiple_choice'
};

describe("convert multiple choice answer", () => {
  it("copies all the expected fields of the logged in variant of the answer", () => {
    const result = convertMultipleChoice({
      oldAnswer: laraAnswerLoggedIn,
      newQuestion,
      oldSourceKey: "authoring.concord.org",
      newSourceKey: "activity-player.concord.org",
      additionalMetadata: {}
    });


    expect(result).toEqual({
      platform_id: 'https://learn.staging.concord.org',
      submitted: false,
      question_id: 'managed_interactive_448816',
      platform_user_id: '5625',
      id: 'converted-authoring.concord.org-answers-multiple_choice_answer_198622',
      resource_link_id: '2445',
      tool_user_id: '2585',
      answer: { choice_ids: [ "50036" ] },
      run_key: '0618c718-a166-47a8-91ad-438675a7d2d3',
      created: '2022-07-18 17:28:24 UTC',
      version: 1,
      remote_endpoint: 'https://learn.staging.concord.org/dataservice/external_activity_data/2a9c96d0-99c0-4ac7-a7f2-efdd18ae28c2',
      context_id: '4395645d355d3a12dee5802cfaca87a840c1e629c887b8e8',
      question_type: 'multiple_choice',
      tool_id: 'activity-player.concord.org',
      type: 'multiple_choice_answer',
      class_info_url: 'https://learn.staging.concord.org/api/v1/classes/724',
      resource_url: 'https://authoring.staging.concord.org/activities/21094',
      source_key: 'activity-player.concord.org',
      answer_text: '(correct) A',
      report_state: '{"mode":"report","authoredState":"{\\"choices\\":[{\\"id\\":\\"50036\\",\\"correct\\":true,\\"content\\":\\"A\\"},{\\"id\\":\\"1504\\",\\"correct\\":false,\\"content\\":\\"B\\"}]}","interactiveState":"{\\"answerType\\":\\"multiple_choice_answer\\",\\"selectedChoiceIds\\":[\\"50036\\"],\\"answerText\\":\\"(correct) A\\",\\"submitted\\":false}","interactive":{"id":"managed_interactive_448816","name":""},"version":1}',
      converted_from: 'authoring.concord.org/answers/multiple_choice_answer_198622',
      converted_at: 'Wed, 20 Jul 2022 12:12:12 UTC'
    });

    const reportState = JSON.parse(result.report_state);
    expect(() => JSON.parse(reportState.authoredState)).not.toThrowError();
    expect(() => JSON.parse(reportState.interactiveState)).not.toThrowError();
  });

  it("copies all the expected fields of the anonymous variant of the answer", () => {
    const result = convertMultipleChoice({
      oldAnswer: laraAnswerAnonymous,
      newQuestion,
      oldSourceKey: "authoring.concord.org",
      newSourceKey: "activity-player.concord.org",
      additionalMetadata: {}
    });

    expect(result).toEqual({
      platform_id: null,
      version: 1,
      class_info_url: null,
      remote_endpoint: null,
      tool_user_id: 'anonymous',
      type: 'multiple_choice_answer',
      question_id: 'managed_interactive_448816',
      source_key: 'activity-player.concord.org',
      resource_url: 'https://authoring.staging.concord.org/activities/84',
      tool_id: 'activity-player.concord.org',
      resource_link_id: null,
      platform_user_id: 'a9143ef0-7312-478b-a66b-3a189781b11c',
      submitted: false,
      answer: { choice_ids: [ "1504" ] },
      run_key: 'a9143ef0-7312-478b-a66b-3a189781b11c',
      created: '2021-10-12 20:29:32 UTC',
      context_id: null,
      id: 'converted-authoring.concord.org-answers-multiple_choice_answer_100707',
      question_type: 'multiple_choice',
      answer_text: 'B',
      report_state: '{"mode":"report","authoredState":"{\\"choices\\":[{\\"id\\":\\"50036\\",\\"correct\\":true,\\"content\\":\\"A\\"},{\\"id\\":\\"1504\\",\\"correct\\":false,\\"content\\":\\"B\\"}]}","interactiveState":"{\\"answerType\\":\\"multiple_choice_answer\\",\\"selectedChoiceIds\\":[\\"1504\\"],\\"answerText\\":\\"B\\",\\"submitted\\":false}","interactive":{"id":"managed_interactive_448816","name":""},"version":1}',
      converted_from: 'authoring.concord.org/answers/multiple_choice_answer_100707',
      converted_at: 'Wed, 20 Jul 2022 12:12:12 UTC'
    });

    const reportState = JSON.parse(result.report_state);
    expect(() => JSON.parse(reportState.authoredState)).not.toThrowError();
    expect(() => JSON.parse(reportState.interactiveState)).not.toThrowError();
  });
});
