import { HydratedDocument } from 'mongoose';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

export type PullRequestDocument = HydratedDocument<PullRequest>;

@Schema()
class User {
  @Prop({ required: true })
  id: string;

  @Prop({ required: true })
  name: string;

  @Prop({ required: false })
  display_name: string;
}

@Schema()
class Reviewer {
  @Prop({ required: true, _id: false })
  user: User;

  @Prop({ required: true })
  status: string;
}

@Schema()
class Message {
  @Prop({ required: true })
  timestamp: string;

  @Prop({ required: false })
  success_timestamp: string;

  @Prop({ required: false })
  dm_channel_id: string;

  @Prop({ required: false })
  permalink: string;
}

@Schema()
export class PullRequest {
  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  link: string;

  @Prop({ required: true })
  type: string;

  @Prop({ required: true, default: 'pending' })
  status: string;

  @Prop({ required: true })
  project: string;

  @Prop({ required: true })
  priority: string;

  @Prop({ required: true })
  ticket: string;

  @Prop({ required: true, _id: false })
  merger: User;

  @Prop({ required: true, _id: false })
  author: User;

  @Prop({ type: [Reviewer], required: true, _id: false })
  reviewers: Reviewer[];

  @Prop({ type: Message, default: null, _id: false })
  message?: Message;
}

export const PullRequestSchema = SchemaFactory.createForClass(PullRequest);

PullRequestSchema.set('versionKey', false);

PullRequestSchema.set('timestamps', true);

PullRequestSchema.set('toJSON', {
  transform: function (doc, ret) {
    ret = {
      id: ret._id,
      ...ret,
    };
    delete ret._id;
    return ret;
  },
});
