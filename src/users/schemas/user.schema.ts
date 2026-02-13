import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type UserDocument = User & Document;

@Schema()
export class User {
  @Prop({ required: true, unique: true })
  username: string;

  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: true })
  password: string;

  @Prop()
  avatar?: string;

  @Prop([{ type: Types.ObjectId, ref: 'User' }])
  followers: Types.ObjectId[];

  @Prop([{ type: Types.ObjectId, ref: 'User' }])
  following: Types.ObjectId[];

}

export const UserSchema = SchemaFactory.createForClass(User);
