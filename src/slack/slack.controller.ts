import { Controller } from '@nestjs/common';
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
}
