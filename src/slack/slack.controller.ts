import { Controller } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { SlackService } from './slack.service';

@Controller('slack')
export class SlackController {
  constructor(private readonly slackService: SlackService) {}

  // @Post('events')
  // handleSlackEvents(@Body() req: SlackEventResponse) {
  //   console.log('here')
  //   // this.slackService.handleSlackEvent(req);
  // }

  // For verifying Request URL
  // @Post('events')
  // handleUrlVerification(@Body() req: VerificationDto) {
  //   console.log(req);
  //   return req.challenge;
  // }

  // @Cron(CronExpression.EVERY_10_SECONDS)
  // @Cron(CronExpression.EVERY_MINUTE)
  // @Cron(CronExpression.EVERY_3_HOURS)
  handleReminderCron() {
    return this.slackService.triggerReviewReminders();
  }
}
