// src/chat/chat.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Conversation, ConversationDocument } from './schemas/conversation.schema';
import { Message, MessageDocument } from './schemas/message.schema';

@Injectable()
export class ChatService {
  constructor(
    @InjectModel(Conversation.name) private conversationModel: Model<ConversationDocument>,
    @InjectModel(Message.name) private messageModel: Model<MessageDocument>,
  ) { }

  async createConversation(participants: string[], isGroup = false, groupName?: string, groupAdmin?: string) {
    const conversation = new this.conversationModel({
      participants,
      isGroup,
      ...(isGroup && { groupName, groupAdmin }),
    });
    await conversation.save();
    return conversation.populate('participants', 'username avatar');
  }

  async getConversations(userId: string) {
    return await this.conversationModel
      .find({ participants: { $in: [userId] } })
      .populate('participants', 'username avatar')
      .populate('lastMessage')
      .sort({ updatedAt: -1 })
      .exec();
  }

  async getOrCreatePrivateConversation(user1Id: string, user2Id: string) {
    const existingConversation = await this.conversationModel.findOne({
      isGroup: false,
      participants: { $all: [user1Id, user2Id], $size: 2 },
    });
    if (existingConversation) {
      return existingConversation;
    }
    return this.createConversation([user1Id, user2Id]);
  }

  // async getOrCreatePrivateConversation(user1Id: string, user2Id: string) {
  //   const [user1, user2] = [user1Id, user2Id].sort();

  //   let conversation = await this.conversationModel
  //     .findOne({
  //       sender: user1,
  //       recipient: user2,
  //       isGroup: false
  //     })
  //     .populate('sender', 'username avatar')
  //     .populate('recipient', 'username avatar');

  //   if (!conversation) {
  //     conversation = new this.conversationModel({
  //       sender: user1,
  //       recipient: user2,
  //       isGroup: false
  //     });
  //     await conversation.save();

  //     // Populate after saving
  //     conversation = await this.conversationModel
  //       .findById(conversation._id)
  //       .populate('sender', 'username avatar')
  //       .populate('recipient', 'username avatar');
  //   }

  //   return conversation;
  // }
  async getMessages(conversationId: string, userId: string, recipientId: string) {
    const conversation = await this.conversationModel.findOne({
      _id: conversationId
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    return this.messageModel
      .find({
        // sender: userId,
        conversation: conversationId
      })
      .sort({ createdAt: -1 })
      .populate('sender', 'username avatar')
      .exec();
  }

  async sendMessage(conversationId: string, senderId: string, content: string) {
    const conversation = await this.conversationModel.findById(conversationId);
    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    const message = new this.messageModel({
      sender: senderId,
      conversation: conversationId,
      content,
    });

    await message.save();

    // Update last message in conversation
    await this.conversationModel.findByIdAndUpdate(conversationId, {
      lastMessage: message._id,
    });

    return message.populate('sender', 'username avatar');
  }


}