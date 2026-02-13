// src/chat/chat.controller.ts
import { Controller, Get, Post, Body, Param, UseGuards, Req, Request, Query } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ChatService } from './chat.service';

@Controller('chat')
@UseGuards(AuthGuard('jwt'))
export class ChatController {
    constructor(private readonly chatService: ChatService) { }

    // @Get('conversations/:userId')
    // async getOrCreatePrivateConversation(@Req() req, @Param('userId') userId: string) {
    //     return this.chatService.getOrCreatePrivateConversation(req.user.userId, userId);
    // }


   @Post('conversations')
  async createConversation(
    @Req() req,
    @Body() body: { recipientId?: string, participants: string[]; isGroup?: boolean; groupName?: string }
  ) {
    const { participants, isGroup = false, groupName } = body;
    const userId = req.user.userId;
    
    return this.chatService.createConversation(
      [userId, body.recipientId],
      isGroup,
      isGroup ? groupName : undefined,
      isGroup ? userId : undefined
    );
  }

  @Get('conversations')
  async getConversations(@Req() req) {
    return this.chatService.getConversations(req.user.userId);
  }
  @Get('conversations/:userId')
  async getOrCreatePrivateConversation(@Req() req, @Param('userId') userId: string) {
    return this.chatService.getOrCreatePrivateConversation(req.user.userId, userId);
  }

    @Get('messages/:conversationId')
    async getMessages(@Req() req, @Param('conversationId') conversationId: string, @Query('recipient') recipient: string) {
        return this.chatService.getMessages(conversationId, req.user.userId, recipient);
    }

    @Post('messages/:conversationId')
    async sendMessage(
        @Param('conversationId') conversationId: string,
        @Body() body: { text: string },
        @Request() req,
    ) {
        return this.chatService.sendMessage(
            conversationId,
            req.user.userId,
            body.text,
        );
    }

    // @Post('conversations/group')
    // async createGroup(
    //     @Req() req,
    //     @Body() body: { name: string; participants: string[] },
    // ) {
    //     return this.chatService.createConversation(
    //         [req.user.userId, ...body.participants],
    //         true,
    //         body.name,
    //         req.user.userId,
    //     );
    // }
}