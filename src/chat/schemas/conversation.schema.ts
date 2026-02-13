// src/chat/schemas/conversation.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ConversationDocument = Conversation & Document;

@Schema({ timestamps: true })
export class Conversation {
//  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
//   sender: Types.ObjectId;

//   @Prop({ type: Types.ObjectId, ref: 'User', required: true })
//   recipient: Types.ObjectId;

 @Prop({ type: [{ type: Types.ObjectId, ref: 'User' }] })
  participants: Types.ObjectId[];
  
  @Prop({ type: Types.ObjectId, ref: 'Message', default: null })
  lastMessage?: Types.ObjectId;

  @Prop({ default: false })
  isGroup: boolean;

  @Prop()
  groupName?: string;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  groupAdmin?: Types.ObjectId;
}

export const ConversationSchema = SchemaFactory.createForClass(Conversation);
// ConversationSchema.index({ sender: 1, recipient: 1 });