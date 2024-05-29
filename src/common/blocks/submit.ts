export const submitPullRequestBlock = (userId: string = '') => {
  return {
    type: 'modal',
    callback_id: 'submit-pr-modal',
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
          text: `:wave:  Hey <@${userId}>,\n\nFill in the form below to submit a PR.`,
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
          options: [
            {
              text: {
                type: 'plain_text',
                text: 'Web',
              },
              value: 'web',
            },
            {
              text: {
                type: 'plain_text',
                text: 'API',
              },
              value: 'api',
            },
            {
              text: {
                type: 'plain_text',
                text: 'Mobile',
              },
              value: 'mobile',
            },
          ],
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
          action_id: 'task',
        },
        label: {
          type: 'plain_text',
          text: 'Task Link (Jira)',
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
          options: [
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
          ],
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
          text: 'Merge manager',
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

export const submitSuccessBlock = (pullRequestTitle: string) => {
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
              text: pullRequestTitle,
              style: {
                bold: true,
              },
            },
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
            text: 'View Pull Request',
            emoji: true,
          },
          url: 'https://google.com',
          action_id: 'view_pull_request_btn',
        },
      ],
    },
  ];
};

export const newPrSubmissionBlock = () => {
  return {
    color: '#33a12f',
    fallback: 'New pull request submitted',
    blocks: [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: '@Ritcheyy submitted a new pull request:\n*<https://google.com|Fred Enriquez - New device request>*',
        },
        accessory: {
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
              value: 'value-1',
            },
            {
              text: {
                type: 'plain_text',
                emoji: true,
                text: ':white_check_mark:  Merged',
              },
              value: 'value-2',
            },
            {
              text: {
                type: 'plain_text',
                emoji: true,
                text: ':x:  Declined',
              },
              value: 'value-3',
            },
          ],
          action_id: 'overflow-action',
        },
      },
      {
        type: 'section',
        fields: [
          {
            type: 'mrkdwn',
            text: '*Project* \nGlover App',
          },
          {
            type: 'mrkdwn',
            text: '*Type*\nFeature',
          },
          {
            type: 'mrkdwn',
            text: '*Priority*\nHigh',
          },
          {
            type: 'mrkdwn',
            text: '*Status*\n`Pending`',
          },
          {
            type: 'mrkdwn',
            text: '*Task*\n<https://google.com|GA-1001>',
          },
          {
            type: 'mrkdwn',
            text: '*Reviewers*\n`@Ritcheyy`, `@Bliss`, `@Ritcheyy`',
          },
        ],
      },
      {
        type: 'divider',
      },
    ],
  };
};
