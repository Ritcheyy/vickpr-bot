export const StatusUpdateNotificationBlock = (text: string, ticketLink?: string) => {
  const isMerged = !!ticketLink;
  const ticketAction = isMerged
    ? [
        {
          type: 'actions',
          elements: [
            {
              type: 'button',
              text: {
                type: 'plain_text',
                text: 'View Ticket',
                emoji: true,
              },
              url: ticketLink,
              action_id: 'view_ticket',
            },
          ],
        },
      ]
    : [];

  return [
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text,
      },
    },
    ...ticketAction,
  ];
};

export const HelpBlock = (userId) => {
  return [
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `Hello <@${userId}> :sunglasses: \n*I'm VickPR - your pull request management assistant.*\nHere's how you can submit a pull request and setup automated reminders:`,
      },
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: ':one:  *Submit a Pull Request* \nYou can use the `/submit_pr` command to submit a pull request. Simply provide the necessary details like the PR link, title, urgency level, Jira task link, and reviewers. \n\n\n:two:  *Automated Reminders* \nOnce a pull request is submitted, I will send automated reminders to reviewers to ensure timely reviews. :clinking_glasses:',
      },
    },
    {
      type: 'divider',
    },
  ];
};
