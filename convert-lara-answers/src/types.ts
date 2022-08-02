/**
 * The answer conversion script needs to use two categories of types:
 * 1. Question/answer-specific types that define its authored state and interactive state (user state).
 *    These are available in this repository in subfolders that match particular question.
 * 2. Answer metadata that needs to match what Activity Player and Portal Report (+ possibly other tools) are expecting.
 *    These had to be copied from Activity Player repository.
 */

import { Timestamp } from "@google-cloud/firestore";

export interface IFeedbackReportHash {
  answerId: string;
  questionId: string;
}

export interface IConvertedFeedbackReportHash extends IFeedbackReportHash {
  legacyAnswerId: string;
  legacyQuestionId: string;
}

export type AnswerType = "interactive_state" | "open_response" | "multiple_choice" |  "image_question" | "labbook";

export interface IManagedInteractiveQuestion {
  id: string;
  ref_id: string;
  authored_state: string | object;
}

export interface IConvertedAnswerMetadata {
  version: 1;
  converted_from: string;
  converted_at: Timestamp;
  legacy_id: string;
  legacy_question_id: string;
  legacy_question_type: string;
}

export interface ILoggedInUserConvertedAnswer extends IConvertedAnswerMetadata, LTIRuntimeAnswerMetadata {}

export interface IAnonymousConvertedAnswer extends IConvertedAnswerMetadata, AnonymousRuntimeAnswerMetadata {}

export type ConvertedAnswer = ILoggedInUserConvertedAnswer | IAnonymousConvertedAnswer;

export interface ILARAAnswerReportHash {
  // Common properties defined in LARA repository: <question_type>_answer.rb#to_report_hash:
  id: string;
  type: string;
  question_id: string;
  question_type: string;
  submitted: boolean | null;
  // Defined in LARA repository: run_sender.rb#add_meta_data:
  version: string | number;
  created: string;
  source_key: string;
  tool_id: string;
  tool_user_id: string;
  platform_id: string;
  platform_user_id: string;
  resource_link_id: string;
  context_id: string;
  resource_url: string;
  class_info_url: string;
  remote_endpoint: string;
  run_key: string;
}

export interface ILARAAnonymousAnswerReportHash {
  // Common properties defined in LARA repository: <question_type>_answer.rb#to_report_hash:
  id: string;
  type: string;
  question_id: string;
  question_type: string;
  submitted: boolean | null;
  // Defined in LARA repository: run_sender.rb#add_meta_data:
  version: string | number;
  created: string;
  source_key: string;
  tool_id: string;
  tool_user_id: string;
  platform_id: null;
  platform_user_id: string; // run key
  resource_link_id: null;
  context_id: null;
  resource_url: string;
  class_info_url: null;
  remote_endpoint: null;
  run_key: string;
}

// See: open_response_answer.rb#report_service_hash
export interface ILARAOpenResponseAnswerReportHash {
  answer: string;
}

// See: multiple_choice_answer.rb#report_service_hash
export interface ILARAMultipleChoiceAnswerReportHash {
  answer: {
    choice_ids: number[];
  }
}

// See: image_question_answer.rb#report_service_hash
export interface ILARAImageQuestionAnswerReportHash {
  answer: {
    image_url: string;
    text: string;
  }
}

// See: multiple_choice_answer.rb#report_service_hash
export interface ILARAMultipleChoiceAnswerReportHash {
  answer: {
    choice_ids: number[];
  }
}

// See: interactive_run_state.rb#report_service_hash
export interface ILARAInteractiveRunStateReportHash {
  report_state: string;
  // depending on type it can be report_state or a state that pretends to be Open Response, Multiple Choice, or Image Question.
  answer: any;
  answer_text: string | null;
}

// --- ACTIVITY PLAYER TYPES ---
// Before running this script, check https://github.com/concord-consortium/activity-player/blob/master/src/types.ts
// and make sure they're up to date.

interface IAttachmentsFolder {
  id: string;
  ownerId: string;
  readWriteToken?: string;
}

interface IReadableAttachmentInfo {
  publicPath: string;
  folder: IAttachmentsFolder;
  contentType: string;
}

export interface ILTIPartial {
  created?: string;
  platform_id: string;      // portal
  platform_user_id: string;
  context_id: string;       // class hash
  resource_link_id: string;  // offering ID
  resource_url: string;
  run_key: string;
  source_key: string;
  tool_id: string;
   // This is not an LTI property but it is required in our authenticated answers
  remote_endpoint: string;
  // These are not LTI properties but are required to track collaborations
  collaborators_data_url?: string;
  collaboration_owner_id?: string;
}

export interface IExportableAnswerMetadataBase {
  created?: string;
  question_id: string;    // converted from refId (e.g. "managed_interactive_404")
  question_type: string;
  id: string;             // randomly generated id (e.g. uuid)
  // type: string;
  answer_text?: string;
  // answer?: any;
  submitted: boolean | null;
  report_state: string;
  // tracks the most recently written details for each attachment
  attachments?: Record<string, IReadableAttachmentInfo>;
  // allows sharing answer with other students in the same class
  shared_with?: "context" | null;
}

export interface LTIRuntimeAnswerMetadata extends ILTIPartial, IExportableAnswerMetadataBase { }

export interface IAnonymousMetadataPartial {
  resource_url: string;
  run_key: string;
  source_key: string;
  tool_id: string;
  tool_user_id: "anonymous";
  platform_user_id: string;
}

export interface AnonymousRuntimeAnswerMetadata extends IAnonymousMetadataPartial, IExportableAnswerMetadataBase { }

export interface IReportState {
  version?: number;
  mode: "report";
  authoredState: string;
  interactiveState: string;
  interactive: {
    id: string;
    name: string;
  }
}

export interface IExportableInteractiveAnswerMetadata extends IExportableAnswerMetadataBase {
  type: "interactive_state";
  answer: string;
}

export interface IExportableOpenResponseAnswerMetadata extends IExportableAnswerMetadataBase {
  type: "open_response_answer";
  answer: string;
}

export interface IExportableImageQuestionAnswerMetadata extends IExportableAnswerMetadataBase {
  type: "image_question_answer";
  answer: {
    text: string;
    image_url: string;
  }
}

export interface IExportableMultipleChoiceAnswerMetadata extends IExportableAnswerMetadataBase {
  type: "multiple_choice_answer";
  answer: {
    choice_ids: string[];
  }
}

export type IExportableAnswerMetadata =
  IExportableInteractiveAnswerMetadata |
  IExportableOpenResponseAnswerMetadata |
  IExportableMultipleChoiceAnswerMetadata |
  IExportableImageQuestionAnswerMetadata;

// --- END OF ACTIVITY PLAYER TYPES ---
