// noinspection TypeScriptValidateJSTypes

import { ValidationError } from 'class-validator';
import { Injectable } from '@nestjs/common';
import { App, ExpressReceiver } from '@slack/bolt';
import { StatusUpdateNotificationBlock } from '@/common/blocks/notifications';
import { NewSubmissionBlock, SubmitPullRequestBlock, SubmitSuccessBlock } from '@/common/blocks/submit';
import { NotificationDispatchTypes, PullRequestStatus, ReviewStatusResponse } from '@/common/constants';
import { _extractBlockFormValues, getUserInfo } from '@/common/helpers';
import { EventTypes, SubmitPullRequestType } from '@/common/types';
import { PullRequestsService } from '@/pull-requests/pull-requests.service';
import Config from '../../config';
import { CreatePullRequestDto } from '@/pull-requests/pull-request.dto';

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
        view: SubmitPullRequestBlock(body.user_id),
      });
    } catch (error) {
      console.log(error);
    }
  }

  async handleSubmitPullRequest({ ack, view, client, body }) {
    // Extract the values from the submitted form
    const { structuredValues, blockIdMapping } = _extractBlockFormValues(view.state.values);
    structuredValues.author = body.user.id;

    try {
      await this.pullRequestsService.validatePullRequestData(structuredValues);
      await ack();

      // fetch users' information
      const _authorPromise = getUserInfo(client, structuredValues.author);
      const _mergerPromise = getUserInfo(client, structuredValues.merger);
      const _reviewersPromises = Promise.all(
        structuredValues.reviewers.map((reviewerId: string) => getUserInfo(client, reviewerId)),
      );

      const [reviewers, merger, author] = await Promise.all([_reviewersPromises, _mergerPromise, _authorPromise]);

      structuredValues.author = author;
      structuredValues.merger = merger;
      structuredValues.reviewers = reviewers.map((reviewer) => ({
        // Transform reviewers data, add review status - pending
        user: reviewer,
        status: PullRequestStatus.PENDING,
      }));

      // Create pull request
      const newPullRequest = await this.pullRequestsService.create(structuredValues as SubmitPullRequestType);

      // Submit pull request to PR Channel
      const messageResponse = await client.chat.postMessage({
        channel: Config.AUTHORIZED_CHANNEL_ID,
        attachments: NewSubmissionBlock(newPullRequest),
      });

      // Update the message timestamp
      newPullRequest.message = {
        timestamp: messageResponse.ts,
      };
      await newPullRequest.save();

      // Retrieve the message permalink
      const { permalink } = await client.chat.getPermalink({
        channel: Config.AUTHORIZED_CHANNEL_ID,
        message_ts: messageResponse.ts,
      });

      // Send success message
      // Todo(not sure if this is necessary): Get if user submits through bot user dm or channel
      await client.chat.postMessage({
        channel: newPullRequest.author.id,
        text: 'Your pull request has been successfully submitted!  :tada:',
        blocks: SubmitSuccessBlock(structuredValues.title, structuredValues.type, permalink),
      });
      return;
    } catch (errors) {
      console.log(errors);
      if (errors instanceof Array && errors[0] instanceof ValidationError) {
        const formattedError = errors.reduce(
          (acc, error) => ({ ...acc, [blockIdMapping[error.property]]: Object.values(error.constraints)[0] }),
          {},
        );
        ack({
          response_action: 'errors',
          errors: formattedError,
        });
      } else {
        ack({
          response_action: 'errors',
          errors: {
            [blockIdMapping['merger']]: 'There was an error with your submission. Please try again later.',
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

    const {
      status: reviewStatusRes,
      data: updatedPullRequest,
      notificationDispatchType,
    } = await this.pullRequestsService.updateReviewStatus(pullRequest, user.id, statusValue);

    // Update the pull request message in the channel
    const statusUpdateResponse = await this.handleSubmissionMessageUpdate({
      reviewStatusRes,
      updatedPullRequest,
      body,
      client,
    });

    if (statusUpdateResponse) {
      // Send notifications to stakeholders depending on review status
      const stakeholders = {
        reviewer: user.id,
        author: updatedPullRequest.author.id,
        merger: updatedPullRequest.merger.id,
      };
      await this.handleNotificationDispatch({ notificationDispatchType, stakeholders, body, client });
    }
  }

  async handleSubmissionMessageUpdate({ reviewStatusRes, updatedPullRequest, body, client }) {
    const { message, user } = body;

    if (reviewStatusRes === ReviewStatusResponse.NOT_A_REVIEWER) {
      await client.chat.postEphemeral({
        channel: Config.AUTHORIZED_CHANNEL_ID,
        user: user.id,
        text: 'I am unable perform this action, you are not listed as a reviewer for this pull request.',
      });
      return false;
    }

    if (reviewStatusRes === ReviewStatusResponse.NOT_THE_MERGER) {
      await client.chat.postEphemeral({
        channel: Config.AUTHORIZED_CHANNEL_ID,
        user: user.id,
        text: 'I am unable perform this action, you are not listed as the merge manager for this pull request.',
      });
      return false;
    }

    await client.chat.update({
      channel: Config.AUTHORIZED_CHANNEL_ID,
      ts: message.ts,
      attachments: NewSubmissionBlock(updatedPullRequest, true),
    });
    return true;
  }

  async handleNotificationDispatch({ notificationDispatchType, stakeholders, body, client }) {
    if (notificationDispatchType !== NotificationDispatchTypes.NONE) {
      let notificationText: string = null;

      switch (notificationDispatchType) {
        case NotificationDispatchTypes.ALL_APPROVED:
          notificationText = `Hey <@${stakeholders.merger}> :wave:\n\nAll reviewers have approved this pull request. Please merge it if it looks good to you.\n\nThank you Boss! :saluting_face:`;
          break;
        case NotificationDispatchTypes.NEW_COMMENT:
          notificationText = `Hey <@${stakeholders.author}> :wave:\n\n<@${stakeholders.reviewer}> left a comment on your pull request. Please attend to it.\n\nThank you!`;
          break;
        case NotificationDispatchTypes.DECLINED:
          notificationText = `Hey <@${stakeholders.author}> :wave:\n\nUnfortunately, your pull request has been declined :pensive:. Please review the feedback and make the necessary changes.\n\nThank you!`;
          break;
        case NotificationDispatchTypes.MERGED:
          notificationText = `Hey <@${stakeholders.author}> :wave:\n\nYour pull request has been merged. :rocket:\n\nThank you!`;
          break;
      }

      await client.chat.postMessage({
        channel: Config.AUTHORIZED_CHANNEL_ID,
        thread_ts: body.message.ts,
        text: notificationText,
        blocks: StatusUpdateNotificationBlock(notificationText),
      });
      return;
    }
  }

  async testAction({ ack, client }) {
    await ack();

    const TEST_DATA = {
      title: 'Test PR',
      link: 'https://www.google.com/',
      type: 'feature',
      status: 'pending',
      project: 'api',
      priority: 'medium',
      ticket: 'https://www.google.com/',
      merger: {
        id: 'U03DB6TJZ55',
        name: 'test merger',
        display_name: 'testMerger',
      },
      author: {
        id: 'U03DRM6SHA7',
        name: 'test author',
        display_name: 'testAuthor',
      },
      reviewers: [
        {
          user: {
            id: 'U06CZSMLP2T',
            name: 'test author',
            display_name: 'testAuthor',
          },
          status: 'pending',
        },
        {
          user: {
            id: 'U06CZSMLP2T',
            name: 'test author',
            display_name: 'testAuthor',
          },
          status: 'pending',
        },
      ],
    };

    // const authorPromise = getUserInfo(client, TEST_DATA.author.id);
    // const mergerPromise = getUserInfo(client, TEST_DATA.merger.id);
    // const reviewersPromises = Promise.all(TEST_DATA.reviewers.map((reviewer) => getUserInfo(client, reviewer.user.id)));

    // const [reviewers, merger, author] = await Promise.all([reviewersPromises, mergerPromise, authorPromise]);

    // await client.chat.postEphemeral({
    //   channel: Config.AUTHORIZED_CHANNEL_ID,
    //   user: body.user.id,
    //   text: 'There was an error with your submission. Please try again later.',
    // });

    await client.chat.postMessage({
      channel: Config.AUTHORIZED_CHANNEL_ID,
      attachments: NewSubmissionBlock(TEST_DATA),
    });
  }
}
