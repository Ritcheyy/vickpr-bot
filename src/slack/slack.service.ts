// noinspection TypeScriptValidateJSTypes

import { Injectable } from '@nestjs/common';
import { App, ExpressReceiver } from '@slack/bolt';
import { EventTypes, SubmitPullRequestType } from '../common/types';
import { submitPullRequestBlock, submitSuccessBlock, newPrSubmissionBlock } from '../common/blocks/submit';
import { PullRequestsService } from '../pull-requests/pull-requests.service';
import { _extractBlockFormValues } from '../common/helpers';

const CHANNEL_ID = 'C075HAJLHPT';

@Injectable()
export class SlackService {
  private boltApp: App;
  private readonly receiver: ExpressReceiver;

  constructor(private readonly pullRequestsService: PullRequestsService) {
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
    this.boltApp.command(EventTypes.CMD_SUBMIT, this.testAction.bind(this));

    // View Events
    this.boltApp.view(EventTypes.MODAL_SUBMIT, this.handleSubmitPullRequest.bind(this));

    // Action Events
    this.boltApp.action(EventTypes.VIEW_PULL_REQUEST_BTN, ({ ack }) => ack());
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
    }
  }

  async handleSubmitModalTrigger({ ack, body, client }) {
    // Acknowledge the command request
    await ack();

    try {
      await client.views.open({
        trigger_id: body.trigger_id,
        view: submitPullRequestBlock(body.user_id),
      });
    } catch (error) {
      console.log(error);
    }
  }

  async handleSubmitPullRequest({ ack, view, client, body }) {
    // Extract the values from the submitted form
    const { structuredValues, blockIdMapping } = _extractBlockFormValues(view.state.values);

    const newPullRequest = await this.pullRequestsService.create(
      structuredValues as SubmitPullRequestType,
      blockIdMapping,
      ack,
    );

    await Promise.all([
      // Submit PR to PR Channel
      client.chat.postMessage({
        channel: CHANNEL_ID,
        // text: `:tada:  <@${body.user.id}> submitted a PR`,
        attachments: [newPrSubmissionBlock()],
      }),

      // Send success message
      client.chat.postMessage({
        channel: body.user.id,
        text: 'Your pull request has been successfully submitted!  :tada:',
        blocks: submitSuccessBlock(structuredValues.link),
      }),
    ]);
  }

  async testAction({ ack, client }) {
    await ack();

    // client.chat.postMessage({
    //   channel: body.user_id,
    //   text: 'Your pull request has been successfully submitted!  :tada:',
    //   blocks: submitSuccessBlock('Feat: Payment Integration'),
    // });

    await client.chat.postMessage({
      channel: CHANNEL_ID,
      // text: `:tada:  <@${body.user_id}> submitted a PR`,
      attachments: [newPrSubmissionBlock()],
    });
  }
}
