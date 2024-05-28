import { Injectable } from '@nestjs/common';
import { App, ExpressReceiver } from '@slack/bolt';
import { EventTypes } from './slack.helper';
import { SUBMIT_PULL_REQUEST_BLOCK } from '../common/blocks/submit-modal';

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

    // Raw Events
    this.boltApp.event(EventTypes.APP_MENTION, this.handleAppMention.bind(this));

    // Command Events
    this.boltApp.command(EventTypes.CMD_SUBMIT, this.handleSubmitModalTrigger.bind(this));

    // View Events
    this.boltApp.view(EventTypes.MODAL_SUBMIT, this.handleSubmitPullRequest.bind(this));
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

  async handleSubmitModalTrigger({ ack, body, client }) {
    // Acknowledge the command request
    await ack();

    try {
      // noinspection TypeScriptValidateJSTypes
      await client.views.open({
        trigger_id: body.trigger_id,
        view: SUBMIT_PULL_REQUEST_BLOCK,
      });
    } catch (error) {
      console.log(error);
      // logger.error(error);
    }
  }

  async handleSubmitPullRequest({ ack, view }) {
    await ack();

    const submittedValues = view.state.values;

    Object.values(submittedValues).forEach((inputField) => {
      const field = Object.keys(inputField)[0];
      const fieldValue = Object.values(inputField)[0];
      const value =
        fieldValue.value ??
        fieldValue.selected_users ??
        fieldValue.selected_user ??
        fieldValue.selected_option?.text?.text ??
        null;
      // Log the value based on the action ID
      console.log(field, value);
    });

    try {
      console.log(submittedValues);
    } catch (error) {
      console.log(error);
      // logger.error(error);
    }
  }
}
