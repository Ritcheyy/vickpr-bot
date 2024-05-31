// noinspection TypeScriptValidateJSTypes

import { Injectable } from '@nestjs/common';
import { App, ExpressReceiver } from '@slack/bolt';
import { ValidationError } from 'class-validator';
import Config from '../../config';
import { _extractBlockFormValues } from '../common/helpers';
import { EventTypes, SubmitPullRequestType } from '../common/types';
import { PullRequestsService } from '../pull-requests/pull-requests.service';
import { PullRequestStatusType, ReviewStatusResponseType } from '../common/constants';
import { submitPullRequestBlock, submitSuccessBlock, newSubmissionNotificationBlock } from '../common/blocks/submit';

@Injectable()
export class SlackService {
  private boltApp: App;
  private readonly receiver: ExpressReceiver;

  constructor(private readonly pullRequestsService: PullRequestsService) {
    this.receiver = new ExpressReceiver({
      signingSecret: Config.SLACK_SIGNING_SECRET,
      endpoints: '/',
    });

    this.boltApp = new App({
      token: Config.SLACK_BOT_TOKEN,
      receiver: this.receiver,
    });

    /*this.boltApp.client.chat.postMessage({
      channel: 'C075HAJLHPT',
      text: '⚡️ Bot App Started',
    });*/

    // Raw Events
    // Todo: Any random direct message should respond with the help block
    this.boltApp.event(EventTypes.APP_MENTION, this.handleAppMention.bind(this));

    // Command Events
    this.boltApp.command(EventTypes.CMD_SUBMIT, this.handleSubmitModalTrigger.bind(this));

    // View Events
    this.boltApp.view(EventTypes.MODAL_SUBMIT, this.handleSubmitPullRequest.bind(this));

    // Action Events
    this.boltApp.action(EventTypes.VIEW_SUBMISSION, ({ ack }) => ack());
    this.boltApp.action(EventTypes.UPDATE_REVIEW_STATUS, this.handleReviewStatusUpdate.bind(this));
  }

  getApp() {
    return this.receiver.app;
  }

  async handleAppMention({ event, say }) {
    try {
      // Todo: improve generic response and add a block element
      // Add button for "are you ready to submit a PR?"...
      await say({
        text: `Hey there <@${event.user}>!`,
        thread_ts: event.ts ?? undefined,
      });
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
    try {
      // Extract the values from the submitted form
      const { structuredValues, blockIdMapping } = _extractBlockFormValues(view.state.values);
      structuredValues.author = body.user.id;

      const newPullRequest = await this.pullRequestsService.create(
        structuredValues as SubmitPullRequestType,
        blockIdMapping,
        ack,
      );

      // Submit pull request to PR Channel
      const messageResponse = await client.chat.postMessage({
        channel: Config.AUTHORIZED_CHANNEL_ID,
        attachments: [newSubmissionNotificationBlock(newPullRequest)],
      });

      // Update the message timestamp
      newPullRequest.message = {
        timestamp: messageResponse.ts,
      };
      newPullRequest.save();

      // Retrieve the message permalink
      const { permalink } = await client.chat.getPermalink({
        channel: Config.AUTHORIZED_CHANNEL_ID,
        message_ts: messageResponse.ts,
      });

      // Send success message
      // Todo: Get if user submits through bot user or channel
      await client.chat.postMessage({
        channel: newPullRequest.author,
        text: 'Your pull request has been successfully submitted!  :tada:',
        blocks: submitSuccessBlock(structuredValues.title, structuredValues.type, permalink),
      });
      return;
    } catch (errors) {
      console.log(errors);
      if (!(errors instanceof Array && errors[0] instanceof ValidationError)) {
        ack({
          response_action: 'errors',
          errors: {
            title: 'There was an error with your submission. Please try again later.',
          },
        });
      }
    }
  }

  async handleReviewStatusUpdate({ ack, body, client }) {
    await ack();

    const { message, user, actions } = body;
    const statusValue = actions[0].selected_option.value;

    const pullRequest = await this.pullRequestsService.findByMessageTimestamp(message.ts);

    if (!pullRequest) {
      await client.chat.postEphemeral({
        channel: Config.AUTHORIZED_CHANNEL_ID,
        user: user.id,
        text: "Sorry, I can't find the pull request submission. Please try again later.",
      });
      return;
    }

    const { status: reviewStatusRes, data: updatedPullRequest } = await this.pullRequestsService.updateReviewStatus(
      pullRequest,
      user.id,
      statusValue,
    );

    if (reviewStatusRes === ReviewStatusResponseType.NOT_A_REVIEWER) {
      await client.chat.postEphemeral({
        channel: Config.AUTHORIZED_CHANNEL_ID,
        user: user.id,
        text: 'I am unable perform this action, you are not listed as a reviewer for this pull request.',
      });
      return;
    }

    await client.chat.update({
      channel: Config.AUTHORIZED_CHANNEL_ID,
      ts: message.ts,
      attachments: [newSubmissionNotificationBlock(updatedPullRequest, true)],
    });
    return;
  }

  async testAction({ ack, client }) {
    await ack();

    const TEST_DATA = {
      title: 'fsgd',
      link: 'https://www.google.com/',
      type: 'feature',
      status: 'pending',
      project: 'api',
      priority: 'medium',
      ticket: 'https://www.google.com/',
      merger: 'U03DB6TJZ55',
      author: 'U03DRM6SHA7',
      reviewers: [
        {
          user: 'U06CZSMLP2T',
          status: 'pending' as PullRequestStatusType,
        },
      ],
    };

    // await client.chat.postEphemeral({
    //   channel: Config.AUTHORIZED_CHANNEL_ID,
    //   user: body.user.id,
    //   text: 'There was an error with your submission. Please try again later.',
    // });

    await client.chat.postMessage({
      channel: Config.AUTHORIZED_CHANNEL_ID,
      attachments: [newSubmissionNotificationBlock(TEST_DATA)],
    });
  }
}
