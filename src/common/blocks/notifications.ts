export const StatusUpdateNotificationBlock = (text: string) => {
  return [
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text,
      },
    },
  ];
};
