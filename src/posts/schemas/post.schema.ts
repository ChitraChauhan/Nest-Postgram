import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema, Types } from 'mongoose';
import { Comment } from './comment.schema';

export type PostDocument = Post & Document;

@Schema({ timestamps: true })
export class Post {
  @Prop()
  caption: string;

  @Prop({ required: true })
  image: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User' })
  author: Types.ObjectId;

  @Prop([{ type: MongooseSchema.Types.ObjectId, ref: 'User' }])
  likes: Types.ObjectId[];

  @Prop({ default: 0 })
  likeCount: number;

  @Prop([{ type: Types.ObjectId, ref: 'Comment' }])
  comments: Comment[];

  @Prop({ default: 0 })
  commentCount: number;
}

export const PostSchema = SchemaFactory.createForClass(Post);
