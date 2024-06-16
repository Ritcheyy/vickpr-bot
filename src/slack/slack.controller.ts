import { Controller } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { SlackService } from './slack.service';

// Todo: move to config
const MONDAY_TO_FRIDAY_AT_11AM = '0 0 11 * * 1-5';
const MONDAY_TO_FRIDAY_AT_4_30PM = '0 30 16 * * 1-5';

@Controller('slack')
export class SlackController {
  constructor(private readonly slackService: SlackService) {}

  @Cron(MONDAY_TO_FRIDAY_AT_11AM)
  handleMorningReminderCron() {
    return this.slackService.triggerReviewReminders();
  }

  @Cron(MONDAY_TO_FRIDAY_AT_4_30PM)
  handleAfternoonReminderCron() {
    return this.slackService.triggerReviewReminders();
  }

  // For verifying the Request URL
  /*  @Post('events')
  handleUrlVerification(@Body() req: VerificationDto) {
    console.log(req);
    return req.challenge;
  }*/
}
