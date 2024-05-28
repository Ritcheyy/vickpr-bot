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
