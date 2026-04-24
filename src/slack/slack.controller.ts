import { Controller } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { SlackService } from './slack.service';
import { isWeeklyReportEnabled } from '@/common/config';

// Todo: move to config
const MONDAY_TO_FRIDAY_AT_09_30AM = CronExpression.MONDAY_TO_FRIDAY_AT_09_30AM;
const MONDAY_TO_FRIDAY_AT_1PM = CronExpression.MONDAY_TO_FRIDAY_AT_1PM;
const MONDAY_TO_FRIDAY_AT_4PM = CronExpression.MONDAY_TO_FRIDAY_AT_4PM;
const THURSDAY_AT_3PM = '0 15 * * 4';

@Controller('slack')
export class SlackController {
  constructor(private readonly slackService: SlackService) {}

  @Cron(MONDAY_TO_FRIDAY_AT_09_30AM)
  handleMorningReminderCron() {
    return this.slackService.triggerReviewReminders();
  }

  @Cron(MONDAY_TO_FRIDAY_AT_1PM)
  handleAfternoonReminderCron() {
    return this.slackService.triggerReviewReminders();
  }
}
