import { Injectable } from '@nestjs/common';
import { App, ExpressReceiver } from '@slack/bolt';
import { EventTypes } from './slack.helper';

@Injectable()
export class SlackService {
  private boltApp: App;
  private readonly receiver: ExpressReceiver;

  constructor() {
    this.receiver = new ExpressReceiver({
      signingSecret: process.env.SLACK_SIGNING_SECRET,
      endpoints: '/',
    });

    this.boltApp = new App({
      token: process.env.SLACK_BOT_TOKEN,
      receiver: this.receiver,
    });

    /*this.boltApp.client.chat.postMessage({
      channel: 'C075HAJLHPT',
      text: '⚡️ Bot App Started',
    });*/

    this.boltApp.event(EventTypes.APP_MENTION, this.handleAppMention.bind(this));
    this.boltApp.command(EventTypes.CMD_SUBMIT, this.handleCreatePullRequest.bind(this));
  }

  getApp() {
    return this.receiver.app;
  }

  async handleAppMention({ event, say }) {
    try {
      console.log(event);
      await say(`Hey there <@${event.user}>!`);
      // Add button for are you ready to submit a PR...
    } catch (error) {
      console.log(error);
      // logger.error(error);
    }
  }

  async handleCreatePullRequest({ payload, say, ack }) {
    await ack();

    try {
      console.log(payload);
      await say(`Hey there`);
    } catch (error) {
      console.log(error);
      // logger.error(error);
    }
  }
}
