import { Types } from 'mongoose';
import { PullRequest } from '@/pull-requests/schemas/pull-request.schema';
import { FancyPrType, PullRequestStatus } from '../constants';
import { getConfiguredProjects } from '@/common/config';
import {
  _capitalizeString,
  _capitalizeWords,
  getAttachmentColor,
  getReviewers,
  getReviewersWithStatusEmoji,
  getTicketIdFromLink,
} from '../helpers';

export const SubmitPullRequestModalBlock = (userId: string = '') => {
  const projects = getConfiguredProjects();
  const projectOptions =
    projects.map((project) => {
      return {
        text: {
          type: 'plain_text',
          text: project,
        },
        value: project,
      };
    }) || [];

  return {
    type: 'modal',
    callback_id: 'submit_pr_modal',
    title: {
      type: 'plain_text',
      text: 'VickPR Bot',
    },
    submit: {
      type: 'plain_text',
      text: 'Submit',
    },
    blocks: [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `Hey <@${userId}> :wave:\n\nFill in the form below to submit a PR.`,
          verbatim: true,
        },
      },
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: ' ',
        },
      },
      {
        type: 'input',
        label: {
          type: 'plain_text',
          text: 'Project',
        },
        element: {
          type: 'static_select',
          placeholder: {
            type: 'plain_text',
            text: 'Select project...',
          },
          action_id: 'project',
          options: projectOptions,
        },
      },
      {
        type: 'input',
        label: {
          type: 'plain_text',
          text: 'Title',
        },
        element: {
          type: 'plain_text_input',
          action_id: 'title',
          placeholder: {
            type: 'plain_text',
            text: 'Ex: Payment Integration...',
          },
        },
      },
      {
        type: 'input',
        element: {
          type: 'url_text_input',
          action_id: 'link',
        },
        label: {
          type: 'plain_text',
          text: 'Link',
          emoji: true,
        },
      },
      {
        type: 'input',
        element: {
          type: 'url_text_input',
          action_id: 'ticket',
        },
        label: {
          type: 'plain_text',
          text: 'Ticket Link (Jira)',
          emoji: true,
        },
      },
      {
        type: 'input',
        label: {
          type: 'plain_text',
          text: 'Type',
        },
        element: {
          type: 'static_select',
          placeholder: {
            type: 'plain_text',
            text: 'Select type...',
          },
          action_id: 'type',
          options: pullRequestTypes,
        },
      },
      {
        type: 'input',
        label: {
          type: 'plain_text',
          text: 'Priority',
        },
        element: {
          type: 'static_select',
          placeholder: {
            type: 'plain_text',
            text: 'Select priority...',
          },
          action_id: 'priority',
          options: [
            {
              text: {
                type: 'plain_text',
                text: 'High',
              },
              value: 'high',
            },
            {
              text: {
                type: 'plain_text',
                text: 'Medium',
              },
              value: 'medium',
            },
            {
              text: {
                type: 'plain_text',
                text: 'Low',
              },
              value: 'low',
            },
            {
              text: {
                type: 'plain_text',
                text: 'Urgent',
              },
              value: 'urgent',
            },
          ],
        },
      },
      {
        type: 'input',
        element: {
          type: 'multi_users_select',
          placeholder: {
            type: 'plain_text',
            text: 'Who will review this PR?',
            emoji: false,
          },
          action_id: 'reviewers',
        },
        label: {
          type: 'plain_text',
          text: 'Reviewers',
          emoji: false,
        },
      },
      {
        type: 'input',
        element: {
          type: 'users_select',
          placeholder: {
            type: 'plain_text',
            text: 'Who will merge this PR?',
            emoji: true,
          },
          action_id: 'merger',
        },
        label: {
          type: 'plain_text',
          text: 'Merge master',
          emoji: true,
        },
      },
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: ' ',
        },
      },
    ],
  };
};

export const SubmitSuccessBlock = (
  pullRequest: PullRequest & { _id: Types.ObjectId },
  messageLink: string,
  isUpdate: boolean = false,
) => {
  const { _id, title, type } = pullRequest;

  return [
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: 'Your pull request has been successfully submitted!  :tada:',
      },
    },
    {
      type: 'rich_text',
      elements: [
        {
          type: 'rich_text_quote',
          elements: [
            {
              type: 'text',
              text: `${_capitalizeString(type)} - ${_capitalizeString(title)} `,
              style: {
                bold: true,
              },
            },
            ...(isUpdate
              ? [
                  {
                    type: 'text',
                    text: 'updated',
                    style: {
                      code: true,
                    },
                  },
                ]
              : []),
          ],
        },
      ],
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: "You'll receive updates on your pull request's progress as I follow up for you. \nHappy hacking! :star-struck:",
      },
    },
    {
      type: 'divider',
    },
    {
      type: 'actions',
      elements: [
        {
          type: 'button',
          text: {
            type: 'plain_text',
            text: 'View Submission',
            emoji: true,
          },
          url: messageLink,
          action_id: 'view_submission',
        },
        {
          type: 'button',
          text: {
            type: 'plain_text',
            text: 'Edit Pull Request',
            emoji: true,
          },
          value: _id.toString(),
          action_id: 'edit_submission',
        },
      ],
    },
  ];
};

export const NewSubmissionBlock = (pullRequest: PullRequest, isUpdate: boolean = false) => {
  const formattedReviewers = isUpdate
    ? getReviewersWithStatusEmoji(pullRequest.reviewers)
    : getReviewers(pullRequest.reviewers);

  const accessory =
    pullRequest.status === PullRequestStatus.MERGED
      ? undefined
      : {
          type: 'overflow',
          options: [
            {
              text: {
                type: 'plain_text',
                emoji: true,
                text: ':heavy_check_mark:  Approved',
              },
              value: 'approved',
            },
            {
              text: {
                type: 'plain_text',
                emoji: true,
                text: ':speech_balloon:  Commented',
              },
              value: 'commented',
            },
            {
              text: {
                type: 'plain_text',
                emoji: true,
                text: ':white_check_mark:  Merged',
              },
              value: 'merged',
            },
            {
              text: {
                type: 'plain_text',
                emoji: true,
                text: ':x:  Declined',
              },
              value: 'declined',
            },
            {
              text: {
                type: 'plain_text',
                emoji: true,
                text: ':double_vertical_bar:  On Hold',
              },
              value: 'on hold',
            },
          ],
          action_id: 'update_review_status',
        };

  return [
    {
      color: getAttachmentColor(pullRequest.status),
      fallback: `@${pullRequest.author.display_name || pullRequest.author.name} submitted a pull request  :rocket: \n*${_capitalizeString(pullRequest.type)} - ${_capitalizeString(pullRequest.title)}*`,
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `<@${pullRequest.author.id}> submitted a pull request  :rocket:\n*<${pullRequest.link}|${_capitalizeString(pullRequest.type)} - ${_capitalizeString(pullRequest.title)}>*`,
          },
          accessory,
        },
        {
          type: 'section',
          fields: [
            {
              type: 'mrkdwn',
              text: `*Project:* ${pullRequest.project}`,
            },
            {
              type: 'mrkdwn',
              text: `*Type:* ${FancyPrType[pullRequest.type]}`,
            },
            {
              type: 'mrkdwn',
              text: `*Priority:* ${_capitalizeString(pullRequest.priority)}`,
            },
            {
              type: 'mrkdwn',
              text: `*Status:* \`${_capitalizeWords(pullRequest.status)}\``,
            },
            {
              type: 'mrkdwn',
              text: `*Ticket:* <${pullRequest.ticket}|${getTicketIdFromLink(pullRequest.ticket)}>`,
            },
            {
              type: 'mrkdwn',
              text: `*Reviewers:* ${formattedReviewers}`,
            },
          ],
        },
        {
          type: 'divider',
        },
      ],
    },
  ];
};

export const SubmissionRequestBlock = () => {
  return [
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: 'Please click on the button below to proceed...',
      },
    },
    {
      type: 'actions',
      elements: [
        {
          type: 'button',
          text: {
            type: 'plain_text',
            text: 'Submit PR',
            emoji: true,
          },
          action_id: 'submit_pr_alt',
        },
      ],
    },
  ];
};

export const EditPullRequestBlock = (pullRequest: PullRequest & { _id: Types.ObjectId }) => {
  const projects = getConfiguredProjects();
  const projectOptions =
    projects.map((project) => {
      return {
        text: {
          type: 'plain_text',
          text: project.trim(),
        },
        value: project.trim(),
      };
    }) || [];
  const prPriorityOptions = [
    {
      text: {
        type: 'plain_text',
        text: 'High',
      },
      value: 'high',
    },
    {
      text: {
        type: 'plain_text',
        text: 'Medium',
      },
      value: 'medium',
    },
    {
      text: {
        type: 'plain_text',
        text: 'Low',
      },
      value: 'low',
    },
    {
      text: {
        type: 'plain_text',
        text: 'Urgent',
      },
      value: 'urgent',
    },
  ];

  const selectedProjectOption = projectOptions.find((option) => option.value === pullRequest.project) || {
    text: {
      type: 'plain_text',
      text: pullRequest.project,
    },
    value: pullRequest.project,
  };
  const selectedTypeOption = pullRequestTypes.find((option) => option.value === pullRequest.type) || {
    text: {
      type: 'plain_text',
      text: FancyPrType[pullRequest.type],
    },
    value: pullRequest.type,
  };
  const selectedPriorityOption = prPriorityOptions.find((option) => option.value === pullRequest.priority) || {
    text: {
      type: 'plain_text',
      text: pullRequest.priority,
    },
    value: pullRequest.priority,
  };
  const selectedReviewers = pullRequest.reviewers.map((reviewer) => reviewer.user.id);

  return {
    type: 'modal',
    callback_id: 'update_pr_modal',
    private_metadata: pullRequest._id.toString(),
    title: {
      type: 'plain_text',
      text: 'VickPR Bot',
    },
    submit: {
      type: 'plain_text',
      text: 'Update',
    },
    blocks: [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `Hey <@${pullRequest.author.id}> :wave:\n\nEdit the form below to update your PR.`,
          verbatim: true,
        },
      },
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: ' ',
        },
      },
      {
        type: 'input',
        label: {
          type: 'plain_text',
          text: 'Project',
        },
        element: {
          type: 'static_select',
          placeholder: {
            type: 'plain_text',
            text: 'Select project...',
          },
          action_id: 'project',
          options: projectOptions,
          initial_option: selectedProjectOption,
        },
      },
      {
        type: 'input',
        label: {
          type: 'plain_text',
          text: 'Title',
        },
        element: {
          type: 'plain_text_input',
          initial_value: pullRequest.title,
          action_id: 'title',
          placeholder: {
            type: 'plain_text',
            text: 'Ex: Payment Integration...',
          },
        },
      },
      {
        type: 'input',
        element: {
          type: 'url_text_input',
          action_id: 'link',
          initial_value: pullRequest.link,
        },
        label: {
          type: 'plain_text',
          text: 'Link',
          emoji: true,
        },
      },
      {
        type: 'input',
        element: {
          type: 'url_text_input',
          action_id: 'ticket',
          initial_value: pullRequest.ticket,
        },
        label: {
          type: 'plain_text',
          text: 'Ticket Link (Jira)',
          emoji: true,
        },
      },
      {
        type: 'input',
        label: {
          type: 'plain_text',
          text: 'Type',
        },
        element: {
          type: 'static_select',
          placeholder: {
            type: 'plain_text',
            text: 'Select type...',
          },
          action_id: 'type',
          options: pullRequestTypes,
          initial_option: selectedTypeOption,
        },
      },
      {
        type: 'input',
        label: {
          type: 'plain_text',
          text: 'Priority',
        },
        element: {
          type: 'static_select',
          placeholder: {
            type: 'plain_text',
            text: 'Select priority...',
          },
          action_id: 'priority',
          options: prPriorityOptions,
          initial_option: selectedPriorityOption,
        },
      },
      {
        type: 'input',
        element: {
          type: 'multi_users_select',
          placeholder: {
            type: 'plain_text',
            text: 'Who will review this PR?',
            emoji: false,
          },
          action_id: 'reviewers',
          initial_users: selectedReviewers,
        },
        label: {
          type: 'plain_text',
          text: 'Reviewers',
          emoji: false,
        },
      },
      {
        type: 'input',
        element: {
          type: 'users_select',
          placeholder: {
            type: 'plain_text',
            text: 'Who will merge this PR?',
            emoji: true,
          },
          action_id: 'merger',
          initial_user: pullRequest.merger.id,
        },
        label: {
          type: 'plain_text',
          text: 'Merge master',
          emoji: true,
        },
      },
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: ' ',
        },
      },
    ],
  };
};


const pullRequestTypes = [
  {
    text: {
      type: 'plain_text',
      text: 'Feature  :sparkles:',
    },
    value: 'feature',
  },
  {
    text: {
      type: 'plain_text',
      text: 'Bugfix  :bug:',
    },
    value: 'bugfix',
  },
  {
    text: {
      type: 'plain_text',
      text: 'Hotfix  :fire:',
    },
    value: 'hotfix',
  },
  {
    text: {
      type: 'plain_text',
      text: 'Doc  :memo:',
    },
    value: 'doc',
  },
  {
    text: {
      type: 'plain_text',
      text: 'Deployment  :rocket:',
    },
    value: 'deployment',
  },
  {
    text: {
      type: 'plain_text',
      text: 'Refactor  :hammer:',
    },
    value: 'refactor',
  },
  {
    text: {
      type: 'plain_text',
      text: 'Style  :lipstick:',
    },
    value: 'style',
  },
  {
    text: {
      type: 'plain_text',
      text: 'Chore  :wrench:',
    },
    value: 'chore',
  },
  {
    text: {
      type: 'plain_text',
      text: 'Perf  :zap:',
    },
    value: 'Perf',
  },
  {
    text: {
      type: 'plain_text',
      text: 'Test  :white_check_mark:',
    },
    value: 'test',
  },
  {
    text: {
      type: 'plain_text',
      text: 'Build  :hammer_and_wrench:',
    },
    value: 'build',
  },
  {
    text: {
      type: 'plain_text',
      text: 'CI  :construction_worker:',
    },
    value: 'ci',
  },
  {
    text: {
      type: 'plain_text',
      text: 'Revert  :rewind:',
    },
    value: 'revert',
  },
];
