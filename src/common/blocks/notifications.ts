export const statusUpdateNotificationBlock = (text: string) => {
  return [
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text,
      },
    },
    {
      type: 'divider',
    },
  ];
};
