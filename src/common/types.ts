import { PullRequestStatusType } from './constants';

export type SlackEventResponse = {
  token: string;
  team_id: string;
  api_app_id: string;
  event: {
    user: string;
    type: string;
    ts: string;
    client_msg_id: string;
    text: string;
    team: string;
    blocks: object[];
    channel: string;
    event_ts: string;
  };
  type: string;
  event_id: string;
  event_time: number;
  authorizations: object[];
};

export enum EventTypes {
  APP_MENTION = 'app_mention',
  CMD_SUBMIT = '/submit-pr',
  MODAL_SUBMIT = 'submit-pr-modal',
  VIEW_SUBMISSION = 'view_submission',
  UPDATE_REVIEW_STATUS = 'update_review_status',
}

export type SubmitPullRequestType = {
  project: string;
  title: string;
  link: string;
  type: string;
  priority: string;
  ticket: string;
  status?: string;
  merger: string;
  reviewers: string[];
};

export type ReviewerType = {
  user: string;
  status: PullRequestStatusType;
};
