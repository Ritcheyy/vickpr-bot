// noinspection TypeScriptValidateJSTypes

import * as moment from 'moment';
import { Injectable } from '@nestjs/common';
import { App, ExpressReceiver } from '@slack/bolt';
import { HelpBlock, StatusUpdateNotificationBlock } from '@/common/blocks/notifications';
import {
  EditPullRequestBlock,
  NewSubmissionBlock,
  SubmissionRequestBlock,
  SubmitPullRequestModalBlock,
  SubmitSuccessBlock,
} from '@/common/blocks/submit';
import {
  NotificationDispatchTypes,
  PullRequestStatus,
  ReminderDispatchTypes,
  ReviewStatusResponse,
} from '@/common/constants';
import {
  _capitalizeString,
  _capitalizeWords,
  _extractBlockFormValues,
  getUserInfo,
  handleSubmissionError,
} from '@/common/helpers';
import {
  getConfiguredProjects,
  getWeeklyReportGroupOrder,
  getWeeklyReportProjectGroupMap,
  isWeeklyReportEnabled,
  resolveWeeklyReportGroupLabel,
} from '@/common/config';
import { PullRequest } from '@/pull-requests/schemas/pull-request.schema';
import { ChannelTypes, EventTypes, SubmitPullRequestType } from '@/common/types';
import { PullRequestsService } from '@/pull-requests/pull-requests.service';

@Injectable()
export class SlackService {
  private boltApp: App;
  private readonly receiver: ExpressReceiver;
  private readonly CHANNEL_ID = process.env.AUTHORIZED_CHANNEL_ID;
  private readonly WEEKLY_REPORT_CHANNEL_ID = process.env.WEEKLY_REPORT_CHANNEL_ID ?? process.env.AUTHORIZED_CHANNEL_ID;
  private readonly SCRUM_MASTER_ID = process.env.SCRUM_MASTER_USER_ID;
  private readonly REMINDER_COUNT_LIMIT = 4;

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
    this.boltApp.view(EventTypes.MODAL_UPDATE, this.handleUpdatePullRequest.bind(this));

    // Button action Events
    this.boltApp.action(EventTypes.VIEW_SUBMISSION, ({ ack }) => ack());
    this.boltApp.action(EventTypes.EDIT_SUBMISSION, this.handleEditSubmission.bind(this));
    this.boltApp.action(EventTypes.VIEW_TICKET, ({ ack }) => ack());
    this.boltApp.action(EventTypes.COMMENT_RESOLVED, this.handleUpdateCommentStatus.bind(this));
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
    if (message.channel_type === ChannelTypes.IM && message.subtype !== 'message_changed') {
      let response: { text: string; blocks: object[] };

      if (message.text.toLowerCase().includes(EventTypes.SUBMIT_PR_TEXT)) {
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
        view: SubmitPullRequestModalBlock(body.user_id ?? body.user?.id),
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

      // Retrieve the message permalink
      const { permalink } = await client.chat.getPermalink({
        channel: this.CHANNEL_ID,
        message_ts: messageResponse.ts,
      });

      // Send success message
      // Todo(not sure if this is necessary): Get if user submits through bot user dm or channel
      const submissionSuccessResponse = await client.chat.postMessage({
        channel: newPullRequest.author.id,
        text: 'Your pull request has been successfully submitted!  :tada:',
        blocks: SubmitSuccessBlock(newPullRequest, permalink),
      });

      // Update the message timestamp
      newPullRequest.message = {
        timestamp: messageResponse.ts,
        success_timestamp: submissionSuccessResponse.ts,
        dm_channel_id: submissionSuccessResponse.channel,
        permalink,
      };
      await newPullRequest.save();

      return;
    } catch (errors) {
      console.error(errors);
      handleSubmissionError(errors, blockIdMapping, ack);
    }
  }

  async handleReviewStatusUpdate({ ack, body, client }) {
    await ack();

    try {
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
        reviewer: currentReviewer,
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
          reviewer: {
            id: currentReviewer.id,
            name: currentReviewer.display_name || currentReviewer.name,
          },
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
    } catch (e) {
      console.log(e);
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
        text: 'I am unable perform this action, you are not listed as the merge master for this pull request.',
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
      const { merger, reviewer, author } = stakeholders;
      const notification = {
        text: '',
        block: '',
      };

      switch (notificationDispatchType) {
        case NotificationDispatchTypes.ALL_APPROVED:
          notification.text = `<@${merger}> All reviewers have approved this pull request. Please merge it if it looks good to you. Thanks Boss! :saluting_face:`;
          notification.block = `<@${merger}>\n\n>All reviewers have approved this pull request. \n>Please merge it if it looks good to you. Thanks Boss! :saluting_face:`;
          break;
        case NotificationDispatchTypes.NEW_COMMENT:
          notification.text = `<@${author}>, @${reviewer.name} has left a comment on your pull request. Please attend to it. Thanks!`;
          notification.block = `<@${author}>\n\n>@${reviewer.name} has left a comment on your pull request. \n>Please attend to it. Thanks!`;
          break;
        case NotificationDispatchTypes.DECLINED:
          notification.text = `<@${author}> Unfortunately, your pull request has been declined. :pensive: Please review the feedback and make the necessary changes. Thanks!`;
          notification.block = `<@${author}>\n\n>Unfortunately, your pull request has been declined. :pensive: \n>Please review the feedback and make the necessary changes. Thanks!`;
          break;
        case NotificationDispatchTypes.MERGED:
          notification.text = `<@${author}> Your pull request has been merged. :rocket: Don't forget to update the ticket status. Thanks!`;
          notification.block = `<@${author}>\n\n>Your pull request has been merged. :rocket: \n>Don't forget to update the ticket status. Thanks!`;
          break;
      }

      await client.chat.postMessage({
        channel: this.CHANNEL_ID,
        thread_ts: body.message.ts,
        text: notification.text,
        blocks: StatusUpdateNotificationBlock(
          notification.block,
          notificationDispatchType === NotificationDispatchTypes.MERGED ? ticket : undefined,
          reviewer.id,
          notificationDispatchType === NotificationDispatchTypes.NEW_COMMENT,
        ),
      });
      return;
    }
  }

  async handleUpdateCommentStatus({ ack, body, action, client }) {
    await ack();

    const commentReviewerId = action.value;
    const { message } = body;
    const pullRequest = await this.pullRequestsService.findByMessageTimestamp(message.thread_ts);

    if (pullRequest) {
      const {
        status: reviewStatusRes,
        data: updatedPullRequest,
        reviewer: currentReviewer,
      } = await this.pullRequestsService.updateReviewStatus(
        pullRequest,
        commentReviewerId,
        PullRequestStatus.REVIEWING,
      );

      // Update the main pull request message in the channel
      const statusUpdateResponse = await this.handleSubmissionMessageUpdate({
        reviewStatusRes,
        updatedPullRequest,
        body: { ...body, message: { ...message, ts: message.thread_ts } },
        client,
      });

      if (statusUpdateResponse) {
        const { author } = updatedPullRequest;

        const reviewerName = currentReviewer?.display_name ?? currentReviewer.name;
        const notification = {
          text: `<@${author.id}>, @${reviewerName} has left a comment on your pull request. Please attend to it. Thanks!`,
          block: `<@${author.id}> - (Resolved :heavy_check_mark:)\n\n>@${reviewerName} has left a comment on your pull request. \n>Please attend to it. Thanks!`,
        };

        await client.chat.update({
          channel: this.CHANNEL_ID,
          ts: message.ts,
          text: notification.text,
          blocks: StatusUpdateNotificationBlock(notification.block, null, currentReviewer.id),
        });
        return;
      }
    }
  }

  async handleEditSubmission({ ack, body, client, action }) {
    await ack();

    try {
      const pullRequestId = action.value;
      const pullRequest = await this.pullRequestsService.findById(pullRequestId);

      if (!pullRequest) {
        return;
      }
      await client.views.open({
        trigger_id: body.trigger_id,
        view: EditPullRequestBlock(pullRequest),
      });
    } catch (error) {
      console.error(error);
    }
  }

  async handleUpdatePullRequest({ ack, view, client, body }) {
    const pullRequestId = view.private_metadata;

    if (!pullRequestId) {
      await ack({ response_action: 'errors', errors: { message: 'Invalid request' } });
      return;
    }

    // Extract the values from the submitted form
    const { structuredValues, blockIdMapping } = _extractBlockFormValues(view.state.values);
    structuredValues.author = body.user.id;

    try {
      await this.pullRequestsService.validatePullRequestData(structuredValues);
      const pullRequest = await this.pullRequestsService.findById(pullRequestId);
      if (!pullRequest) {
        await ack({ response_action: 'errors', errors: { message: 'Invalid request' } });
        return;
      }

      await ack();

      // fetch users' information
      structuredValues.author = pullRequest.author;

      if (structuredValues.merger === pullRequest.merger.id) {
        structuredValues.merger = pullRequest.merger;
      } else {
        structuredValues.merger = await getUserInfo(client, structuredValues.merger);
      }

      if (JSON.stringify(structuredValues.reviewers) == JSON.stringify(pullRequest.reviewers.map((r) => r.user.id))) {
        structuredValues.reviewers = pullRequest.reviewers;
      } else {
        const _reviewersPromises = Promise.all(
          structuredValues.reviewers.map((reviewerId: string) => getUserInfo(client, reviewerId)),
        );
        const reviewers = await _reviewersPromises;

        structuredValues.reviewers = reviewers.map((reviewer) => ({
          user: reviewer,
          status: pullRequest.reviewers.find((r) => r.user.id === reviewer.id)?.status || PullRequestStatus.PENDING,
        }));
      }

      const updatedPullRequest = await this.pullRequestsService.update(pullRequestId, structuredValues);

      await client.chat.update({
        channel: this.CHANNEL_ID,
        ts: pullRequest.message.timestamp,
        attachments: NewSubmissionBlock(updatedPullRequest),
      });

      await client.chat.update({
        channel: pullRequest.message.dm_channel_id,
        ts: pullRequest.message.success_timestamp,
        blocks: SubmitSuccessBlock(updatedPullRequest, pullRequest.message.permalink, true),
        text: `Your pull request has been successfully updated!`,
      });
    } catch (errors) {
      console.error(errors);
      handleSubmissionError(errors, blockIdMapping, ack);
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
        const hasPendingComment =
          pullRequest.status === PullRequestStatus.COMMENTED ||
          pullRequest.reviewers.some((reviewer) => reviewer.status === PullRequestStatus.COMMENTED);

        if (hasPendingComment) {
          // send notification to the author
          await this.handleReminderDispatch({
            stakeholdersId: [pullRequest.author.id],
            reminderType: ReminderDispatchTypes.AUTHOR,
            metaData: {
              reminderCount: pullRequest.reminder_count,
              messageTimestamp: pullRequest.message?.timestamp,
            },
          });
        } else {
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
          await this.handleReminderDispatch({
            stakeholdersId,
            reminderType,
            metaData: {
              reminderCount: pullRequest.reminder_count,
              messageTimestamp: pullRequest.message?.timestamp,
            },
          });
        }

        if (pullRequest.reminder_count !== undefined) {
          pullRequest.reminder_count += 1;
          await pullRequest.save();
        }
      }
    } catch (error) {
      console.error(error);
    }
  }

  async handleReminderDispatch({ stakeholdersId, reminderType, metaData }) {
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
      case ReminderDispatchTypes.AUTHOR:
        notification.text = `<@${stakeholdersId[0]}> This is soft a reminder to attend to the comment(s) on your pull request. Thanks!  :pray:`;
        notification.block = `<@${stakeholdersId[0]}>\n\n>This is soft a reminder to attend to the comment(s) on your pull request. Thanks!  :pray:`;
        break;
    }

    // Tag a user to follow up on the PR
    if (reminderType !== ReminderDispatchTypes.MERGER && metaData.reminderCount >= this.REMINDER_COUNT_LIMIT) {
      notification.text = `${notification.text} cc: <@${this.SCRUM_MASTER_ID}>`;
      notification.block = `${notification.block}\n\n cc: <@${this.SCRUM_MASTER_ID}>`;
    }

    await this.boltApp.client.chat.postMessage({
      channel: this.CHANNEL_ID,
      thread_ts: metaData.messageTimestamp,
      text: notification.text,
      blocks: StatusUpdateNotificationBlock(notification.block),
    });
    return;
  }

  /**
   * Generates the weekly summary, grouped project updates, and dispatches them to the configured Slack channel.
   * The report is windowed to the last seven days so it can be triggered on the Thursday 3PM cron.
   */
  async triggerWeeklyReport() {
    if (!isWeeklyReportEnabled()) {
      return;
    }

    if (!this.WEEKLY_REPORT_CHANNEL_ID) {
      console.warn('Weekly report skipped: WEEKLY_REPORT_CHANNEL_ID is not configured.');
      return;
    }

    try {
      const reportEnd = moment();
      const reportStart = moment(reportEnd).subtract(7, 'days');

      // read client-specific configuration for mapping projects to report groups
      const projectGroupMap = getWeeklyReportProjectGroupMap();
      const configuredProjects = getConfiguredProjects();

      const rawPullRequests = await this.pullRequestsService.findCreatedBetween(
        reportStart.toDate(),
        reportEnd.toDate(),
        configuredProjects,
      );

      const baseGroupOrder = getWeeklyReportGroupOrder();
      const groupedPullRequests: Record<string, PullRequest[]> = {};
      const additionalGroupOrder: string[] = [];
      const includedPullRequests: PullRequest[] = [];

      rawPullRequests.forEach((pullRequest) => {
        const projectKey = (pullRequest.project || '').trim().toLowerCase();
        const groupKey = projectGroupMap[projectKey];

        if (!groupKey) {
          // skip PRs when no mapping exists; we log the aggregate below for visibility
          return;
        }

        if (!groupedPullRequests[groupKey]) {
          groupedPullRequests[groupKey] = [];

          if (!baseGroupOrder.includes(groupKey)) {
            additionalGroupOrder.push(groupKey);
          }
        }

        groupedPullRequests[groupKey].push(pullRequest);
        includedPullRequests.push(pullRequest);
      });

      baseGroupOrder.forEach((groupKey) => {
        groupedPullRequests[groupKey] = groupedPullRequests[groupKey] || [];
      });

      const orderedGroups = [...baseGroupOrder, ...additionalGroupOrder];

      const pendingStatuses = new Set<string>([
        PullRequestStatus.PENDING,
        PullRequestStatus.REVIEWING,
        PullRequestStatus.COMMENTED,
        PullRequestStatus.APPROVED,
        PullRequestStatus.ON_HOLD,
      ]);

      const totalCount = includedPullRequests.length;
      // pending count is intentionally broad so teams can triage both open and review-in-progress work
      const pendingCount = includedPullRequests.filter((pullRequest) => pendingStatuses.has(pullRequest.status)).length;
      const mergedCount = includedPullRequests.filter((pullRequest) => pullRequest.status === PullRequestStatus.MERGED).length;

      const reportWindowText = `${reportStart.format('MMM Do')} → ${reportEnd.format('MMM Do')}`;

      const summaryBlocks = [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*Weekly Pull Requests Report*  :bookmark_tabs:\n${reportWindowText}\n\n:hourglass_flowing_sand:  Pending: *${pendingCount}*\n\n:rocket:  Merged: *${mergedCount}*\n\n:1234:  Total: *${totalCount}*`,
          },
        },
      ];

      const summaryMessage = await this.boltApp.client.chat.postMessage({
        channel: this.WEEKLY_REPORT_CHANNEL_ID,
        text: 'Weekly Pull Requests Report',
        blocks: summaryBlocks,
      });

      const threadTimestamp = summaryMessage.ts;

      for (const groupKey of orderedGroups) {
        const groupLabel = resolveWeeklyReportGroupLabel(groupKey);
        const groupBlocks = this.buildWeeklyReportGroupBlocks(groupLabel, groupedPullRequests[groupKey]);

        await this.boltApp.client.chat.postMessage({
          channel: this.WEEKLY_REPORT_CHANNEL_ID,
          thread_ts: threadTimestamp,
          text: `${groupLabel} Weekly Report`,
          blocks: groupBlocks,
        });
      }

      const ignoredCount = rawPullRequests.length - includedPullRequests.length;

      if (ignoredCount > 0) {
        console.warn(`Weekly report ignored ${ignoredCount} pull request(s) due to missing project group mapping.`);
      }

      console.log(`\n\nTriggered: Weekly Report - ${reportEnd.format()}\n\n`);
    } catch (error) {
      console.error('Failed to dispatch weekly report', error);
    }
  }

  /**
   * Formats a group's pull requests into a Slack message section so each department update can be threaded.
   * @param groupLabel Human-friendly label (e.g. "Frontend") that will headline the section.
   * @param pullRequests The pull requests assigned to the group for the reporting window.
   */
  private buildWeeklyReportGroupBlocks(groupLabel: string, pullRequests: PullRequest[]) {
    const header = `*${groupLabel} Team*`;

    const body =
      pullRequests.length > 0
        ? pullRequests
            .map((pullRequest) => {
              const statusLabel =
                pullRequest.status === PullRequestStatus.MERGED ? 'Done' : 'In Progress';
              const title = _capitalizeString(pullRequest.title) || 'Untitled PR';

              return `• ${title} → _${statusLabel}_`;
            })
            .join('\n')
        : '_No updates for this period._ :zzz:';

    return [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `${header}\n\n${body}\n\n\u200B`, // \u200B is a zero-width space
        },
      },
    ];
  }

  async testAction({ ack }) {
    await ack();

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
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

    /* await client.chat.postMessage({
      channel: this.CHANNEL_ID,
      attachments: NewSubmissionBlock(TEST_DATA),
    }); */
  }
}
