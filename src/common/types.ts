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
  CMD_SUBMIT = '/submit_pr',
  CMD_SUBMIT_ALT = 'submit_pr_alt',
  TEST_CMD_SUBMIT = '/submit_pr_test',
  SUBMIT_PR_TEXT = '!submit_pr',
  MODAL_SUBMIT = 'submit_pr_modal',
  VIEW_SUBMISSION = 'view_submission',
  UPDATE_REVIEW_STATUS = 'update_review_status',
  VIEW_TICKET = 'view_ticket',
  COMMENT_RESOLVED = 'comment_resolved',
}

export enum ChannelTypes {
  IM = 'im',
  CHANNEL = 'channel',
}

export type SubmitPullRequestType = {
  project: string;
  title: string;
  link: string;
  type: string;
  priority: string;
  ticket: string;
  status?: string;
  merger: User;
  author: User;
  reviewers: ReviewerType[];
};

export type User = {
  id: string;
  name: string;
  display_name: string;
};

export type ReviewerType = {
  user: User;
  status: string;
};
