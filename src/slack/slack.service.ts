// noinspection TypeScriptValidateJSTypes

import * as moment from 'moment';
import { ValidationError } from 'class-validator';
import { Injectable } from '@nestjs/common';
import { App, ExpressReceiver } from '@slack/bolt';
import { HelpBlock, StatusUpdateNotificationBlock } from '@/common/blocks/notifications';
import {
  NewSubmissionBlock,
  SubmissionRequestBlock,
  SubmitPullRequestBlock,
  SubmitSuccessBlock,
} from '@/common/blocks/submit';
import {
  NotificationDispatchTypes,
  ReminderDispatchTypes,
  PullRequestStatus,
  ReviewStatusResponse,
} from '@/common/constants';
import { _extractBlockFormValues, getUserInfo } from '@/common/helpers';
import { ChannelTypes, EventTypes, SubmitPullRequestType } from '@/common/types';
import { PullRequestsService } from '@/pull-requests/pull-requests.service';

@Injectable()
export class SlackService {
  private boltApp: App;
  private readonly receiver: ExpressReceiver;
  private readonly CHANNEL_ID = process.env.AUTHORIZED_CHANNEL_ID;

  constructor(private readonly pullRequestsService: PullRequestsService) {
    this.receiver = new ExpressReceiver({
      signingSecret: process.env.SLACK_SIGNING_SECRET,
      endpoints: '/',
    });

    this.boltApp = new App({
      token: process.env.SLACK_BOT_TOKEN,
      receiver: this.receiver,
    });

    console.log('⚡️ Bot App Started');

    // Raw Events - help events
    this.boltApp.message(this.handleAppMessage.bind(this));
    this.boltApp.event(EventTypes.APP_MENTION, this.handleAppMention.bind(this));

    // Command Events
    this.boltApp.command(EventTypes.CMD_SUBMIT, this.handleSubmitModalTrigger.bind(this));
    this.boltApp.action(EventTypes.CMD_SUBMIT_ALT, this.handleSubmitModalTrigger.bind(this)); // for external connections
    this.boltApp.command(EventTypes.TEST_CMD_SUBMIT, this.handleSubmitModalTrigger.bind(this));

    // View Events
    this.boltApp.view(EventTypes.MODAL_SUBMIT, this.handleSubmitPullRequest.bind(this));

    // Button action Events
    this.boltApp.action(EventTypes.VIEW_SUBMISSION, ({ ack }) => ack());
    this.boltApp.action(EventTypes.VIEW_TICKET, ({ ack }) => ack());
    this.boltApp.action(EventTypes.UPDATE_REVIEW_STATUS, this.handleReviewStatusUpdate.bind(this));
  }

  getApp() {
    return this.receiver.app;
  }

  async handleAppMention({ event, say }) {
    try {
      await say({
        text: `Hello <@${event.user}> :sunglasses: I'm VickPR - your pull request management assistant`,
        thread_ts: event.ts,
        blocks: HelpBlock(event.user),
      });
    } catch (error) {
      console.error(error);
    }
  }

  async handleAppMessage({ message, say }) {
    if (message.channel_type === ChannelTypes.IM) {
      let response: { text: string; blocks: object[] };

      if (message.text.toString().toLowerCase().includes('!submit_pr')) {
        response = {
          text: 'Submit a Pull Request',
          blocks: SubmissionRequestBlock(),
        };
      } else {
        response = {
          text: `Hello <@${message.user}> :sunglasses: I'm VickPR - your pull request management assistant`,
          blocks: HelpBlock(message.user),
        };
      }

      try {
        await say(response);
      } catch (error) {
        console.error(error);
      }
    }
  }

  async handleSubmitModalTrigger({ ack, body, client }) {
    // Acknowledge the command request
    await ack();

    try {
      await client.views.open({
        trigger_id: body.trigger_id,
        view: SubmitPullRequestBlock(body.user_id ?? body.user?.id),
      });
    } catch (error) {
      console.error(error);
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
        channel: this.CHANNEL_ID,
        attachments: NewSubmissionBlock(newPullRequest),
      });

      // Update the message timestamp
      newPullRequest.message = {
        timestamp: messageResponse.ts,
      };
      await newPullRequest.save();

      // Retrieve the message permalink
      const { permalink } = await client.chat.getPermalink({
        channel: this.CHANNEL_ID,
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
      console.error(errors);
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
        channel: this.CHANNEL_ID,
        thread_ts: message.ts,
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
      await this.handleNotificationDispatch({
        notificationDispatchType,
        stakeholders,
        body,
        client,
        ticket: updatedPullRequest.ticket,
      });
    }
  }

  async handleSubmissionMessageUpdate({ reviewStatusRes, updatedPullRequest, body, client }) {
    const { message, user } = body;

    if (reviewStatusRes === ReviewStatusResponse.NOT_A_REVIEWER) {
      await client.chat.postEphemeral({
        channel: this.CHANNEL_ID,
        user: user.id,
        text: 'I am unable perform this action, you are not listed as a reviewer for this pull request.',
      });
      return false;
    }

    if (reviewStatusRes === ReviewStatusResponse.NOT_THE_MERGER) {
      await client.chat.postEphemeral({
        channel: this.CHANNEL_ID,
        user: user.id,
        text: 'I am unable perform this action, you are not listed as the merge manager for this pull request.',
      });
      return false;
    }

    await client.chat.update({
      channel: this.CHANNEL_ID,
      ts: message.ts,
      attachments: NewSubmissionBlock(updatedPullRequest, true),
    });
    return true;
  }

  async handleNotificationDispatch({ notificationDispatchType, stakeholders, body, client, ticket }) {
    if (notificationDispatchType !== NotificationDispatchTypes.NONE) {
      const notification = {
        text: '',
        block: '',
      };

      switch (notificationDispatchType) {
        case NotificationDispatchTypes.ALL_APPROVED:
          notification.text = `<@${stakeholders.merger}> All reviewers have approved this pull request. Please merge it if it looks good to you. Thanks Boss! :saluting_face:`;
          notification.block = `<@${stakeholders.merger}>\n\n>All reviewers have approved this pull request. \n>Please merge it if it looks good to you. Thanks Boss! :saluting_face:`;
          break;
        case NotificationDispatchTypes.NEW_COMMENT:
          notification.text = `<@${stakeholders.author}>, <@${stakeholders.reviewer}> has left a comment on your pull request. Please attend to it. Thanks!`;
          notification.block = `<@${stakeholders.author}>\n\n><@${stakeholders.reviewer}> has left a comment on your pull request. \n>Please attend to it. Thanks!`;
          break;
        case NotificationDispatchTypes.DECLINED:
          notification.text = `<@${stakeholders.author}> Unfortunately, your pull request has been declined. :pensive: Please review the feedback and make the necessary changes. Thanks!`;
          notification.block = `<@${stakeholders.author}>\n\n>Unfortunately, your pull request has been declined. :pensive: \n>Please review the feedback and make the necessary changes. Thanks!`;
          break;
        case NotificationDispatchTypes.MERGED:
          notification.text = `<@${stakeholders.author}> Your pull request has been merged. :rocket: Don't forget to update the ticket status. Thanks!`;
          notification.block = `<@${stakeholders.author}>\n\n>Your pull request has been merged. :rocket: \n>Don't forget to update the ticket status. Thanks!`;
          break;
      }

      await client.chat.postMessage({
        channel: this.CHANNEL_ID,
        thread_ts: body.message.ts,
        text: notification.text,
        blocks: StatusUpdateNotificationBlock(
          notification.block,
          notificationDispatchType === NotificationDispatchTypes.MERGED ? ticket : undefined,
        ),
      });
      return;
    }
  }

  // cron job handler
  async triggerReviewReminders() {
    try {
      console.log(`\n\nTriggered: Review Reminders - ${moment().format()}\n\n`);

      const pendingPullRequests = await this.pullRequestsService.getAllPending();
      if (!pendingPullRequests) {
        return;
      }

      const reviewClosedStatuses: string[] = [PullRequestStatus.MERGED, PullRequestStatus.APPROVED];

      for (const pullRequest of pendingPullRequests) {
        const pendingReviewers = pullRequest.reviewers.filter(
          (reviewer) => !reviewClosedStatuses.includes(reviewer.status),
        );

        const hasTotalApprovals = !pendingReviewers.length;
        let stakeholdersId: string[];
        let reminderType: string;

        if (hasTotalApprovals) {
          // send notification to the merger instead
          stakeholdersId = [pullRequest.merger.id];
          reminderType = ReminderDispatchTypes.MERGER;
        } else {
          stakeholdersId = pendingReviewers.map((reviewer) => reviewer.user.id);
          reminderType = ReminderDispatchTypes.REVIEWERS;
        }

        // noinspection ES6MissingAwait, Todo: implement queue
        this.handleReminderDispatch({
          stakeholdersId,
          reminderType,
          messageTimestamp: pullRequest.message?.timestamp,
        });
      }
    } catch (error) {
      console.error(error);
    }
  }

  async handleReminderDispatch({ stakeholdersId, reminderType, messageTimestamp }) {
    const notification = {
      text: '',
      block: '',
    };

    switch (reminderType) {
      case ReminderDispatchTypes.MERGER:
        notification.text = `<@${stakeholdersId[0]}> This is a soft reminder to review/merge the above pull request, as all reviewers have approved. Thanks!  :pray:`;
        notification.block = `<@${stakeholdersId[0]}>\n\n>This is a soft reminder to review/merge the above pull request, as all reviewers have approved. Thanks!  :pray:`;
        break;
      case ReminderDispatchTypes.REVIEWERS:
        const reviewers = stakeholdersId.map((id) => `<@${id}>`).join(', ');
        notification.text = `${reviewers} This is a soft reminder to review and update the above pull request. Thanks!  :pray:`;
        notification.block = `${reviewers}\n\n>This is a soft reminder to review and update the above pull request. Thanks!  :pray:`;
        break;
    }

    // console.log(notificationText, stakeholdersId, messageTimestamp);
    // return;

    await this.boltApp.client.chat.postMessage({
      channel: this.CHANNEL_ID,
      thread_ts: messageTimestamp,
      text: notification.text,
      blocks: StatusUpdateNotificationBlock(notification.block),
    });
    return;
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
    //   channel: this.CHANNEL_ID,
    //   user: body.user.id,
    //   text: 'There was an error with your submission. Please try again later.',
    // });

    await client.chat.postMessage({
      channel: this.CHANNEL_ID,
      attachments: NewSubmissionBlock(TEST_DATA),
    });
  }
}
