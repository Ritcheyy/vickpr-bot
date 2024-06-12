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
