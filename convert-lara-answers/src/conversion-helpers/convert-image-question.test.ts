import { convertImageQuestion } from "./convert-image-question";
import { ILARAAnonymousAnswerReportHash, ILARAAnswerReportHash, ILARAImageQuestionAnswerReportHash } from "../types";

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

const laraAnswerLoggedIn: ILARAAnswerReportHash & ILARAImageQuestionAnswerReportHash = {
  context_id: '471ca0f6c36b66704e542611b67d8cb52b56437538c6242c',
  run_key: '19bfcb93-ccbf-4f53-84a7-296294821954',
  type: 'image_question_answer',
  id: 'image_question_answer_69831',
  submitted: false,
  platform_id: 'https://learn.staging.concord.org',
  resource_url: 'https://authoring.staging.concord.org/activities/21639',
  version: '1',
  answer: {
    text: 'Snapshot!',
    image_url: 'https://ccshutterbug.s3.amazonaws.com/1658755775407-207126.png'
  },
  platform_user_id: '147',
  resource_link_id: '2462',
  class_info_url: 'https://learn.staging.concord.org/api/v1/classes/32',
  question_id: 'image_question_212395',
  question_type: 'image_question',
  remote_endpoint: 'https://learn.staging.concord.org/dataservice/external_activity_data/933e2f3f-13b2-4119-b3b9-97485aaa8c58',
  tool_user_id: '1406',
  source_key: 'authoring.staging.concord.org',
  tool_id: 'https://authoring.staging.concord.org',
  created: '2022-07-25 13:29:48 UTC'
};

const laraAnswerAnonymous: ILARAAnonymousAnswerReportHash & ILARAImageQuestionAnswerReportHash = {
  submitted: false,
  platform_user_id: 'b6a0b038-ae07-444f-8be9-efc7eaa985aa',
  run_key: 'b6a0b038-ae07-444f-8be9-efc7eaa985aa',
  resource_link_id: null,
  tool_id: 'https://authoring.staging.concord.org',
  context_id: null,
  tool_user_id: '',
  id: 'image_question_answer_2370',
  resource_url: 'https://authoring.staging.concord.org/activities/84',
  class_info_url: null,
  platform_id: null,
  answer: {
    image_url: 'https://ccshutterbugtest.s3.amazonaws.com/16c85da7dbf.png',
    text: ''
  },
  question_type: 'image_question',
  type: 'image_question_answer',
  question_id: 'image_question_61',
  created: '2021-10-12 13:38:16 UTC',
  source_key: 'authoring.staging.concord.org',
  version: '1',
  remote_endpoint: null
};

describe("convert image question answer", () => {
  it("copies all the expected fields of the logged in variant of the answer", () => {
    const result = convertImageQuestion({
      oldAnswer: laraAnswerLoggedIn,
      newQuestion,
      oldSourceKey: "authoring.concord.org",
      newSourceKey: "activity-player.concord.org",
      additionalMetadata: {}
    });

    expect(result).toEqual({
      context_id: '471ca0f6c36b66704e542611b67d8cb52b56437538c6242c',
      run_key: '19bfcb93-ccbf-4f53-84a7-296294821954',
      type: 'image_question_answer',
      id: 'converted-authoring.concord.org-answers-image_question_answer_69831',
      submitted: false,
      platform_id: 'https://learn.staging.concord.org',
      resource_url: 'https://authoring.staging.concord.org/activities/21639',
      version: 1,
      answer: {
        text: 'Snapshot!',
        image_url: 'https://ccshutterbug.s3.amazonaws.com/1658755775407-207126.png'
      },
      platform_user_id: '147',
      resource_link_id: '2462',
      class_info_url: 'https://learn.staging.concord.org/api/v1/classes/32',
      question_id: 'managed_interactive_448816',
      question_type: 'image_question',
      remote_endpoint: 'https://learn.staging.concord.org/dataservice/external_activity_data/933e2f3f-13b2-4119-b3b9-97485aaa8c58',
      tool_user_id: '1406',
      source_key: 'activity-player.concord.org',
      tool_id: 'activity-player.concord.org',
      created: '2022-07-25 13:29:48 UTC',
      answer_text: 'Snapshot!',
      report_state: '{"mode":"report","authoredState":"{\\"authoredProp\\":\\"value\\"}","interactiveState":"{\\"answerType\\":\\"image_question_answer\\",\\"answerImageUrl\\":\\"https://ccshutterbug.s3.amazonaws.com/1658755775407-207126.png\\",\\"answerText\\":\\"Snapshot!\\",\\"submitted\\":false}","interactive":{"id":"managed_interactive_448816","name":""},"version":1}',
      legacy_answer_image_url: 'https://ccshutterbug.s3.amazonaws.com/1658755775407-207126.png',
      converted_from: 'authoring.concord.org/answers/image_question_answer_69831',
      converted_at: 'Wed, 20 Jul 2022 12:12:12 UTC',
      legacy_id: "image_question_answer_69831",
      legacy_question_id: "image_question_212395",
      legacy_question_type: "image_question",
    });

    const reportState = JSON.parse(result.report_state);
    expect(() => JSON.parse(reportState.authoredState)).not.toThrowError();
    expect(() => JSON.parse(reportState.interactiveState)).not.toThrowError();
  });

  it("copies all the expected fields of the anonymous variant of the answer", () => {
    const result = convertImageQuestion({
      oldAnswer: laraAnswerAnonymous,
      newQuestion,
      oldSourceKey: "authoring.concord.org",
      newSourceKey: "activity-player.concord.org",
      additionalMetadata: {}
    });

    expect(result).toEqual({
      submitted: false,
      platform_user_id: 'b6a0b038-ae07-444f-8be9-efc7eaa985aa',
      run_key: 'b6a0b038-ae07-444f-8be9-efc7eaa985aa',
      resource_link_id: null,
      tool_id: 'activity-player.concord.org',
      context_id: null,
      tool_user_id: 'anonymous',
      id: 'converted-authoring.concord.org-answers-image_question_answer_2370',
      resource_url: 'https://authoring.staging.concord.org/activities/84',
      class_info_url: null,
      platform_id: null,
      answer: {
        image_url: 'https://ccshutterbugtest.s3.amazonaws.com/16c85da7dbf.png',
        text: ''
      },
      question_type: 'image_question',
      type: 'image_question_answer',
      question_id: 'managed_interactive_448816',
      created: '2021-10-12 13:38:16 UTC',
      source_key: 'activity-player.concord.org',
      version: 1,
      remote_endpoint: null,
      answer_text: '',
      report_state: '{"mode":"report","authoredState":"{\\"authoredProp\\":\\"value\\"}","interactiveState":"{\\"answerType\\":\\"image_question_answer\\",\\"answerImageUrl\\":\\"https://ccshutterbugtest.s3.amazonaws.com/16c85da7dbf.png\\",\\"answerText\\":\\"\\",\\"submitted\\":false}","interactive":{"id":"managed_interactive_448816","name":""},"version":1}',
      legacy_answer_image_url: 'https://ccshutterbugtest.s3.amazonaws.com/16c85da7dbf.png',
      converted_from: 'authoring.concord.org/answers/image_question_answer_2370',
      converted_at: 'Wed, 20 Jul 2022 12:12:12 UTC',
      legacy_id: "image_question_answer_2370",
      legacy_question_id: "image_question_61",
      legacy_question_type: "image_question",
    });

    const reportState = JSON.parse(result.report_state);
    expect(() => JSON.parse(reportState.authoredState)).not.toThrowError();
    expect(() => JSON.parse(reportState.interactiveState)).not.toThrowError();
  });
});
