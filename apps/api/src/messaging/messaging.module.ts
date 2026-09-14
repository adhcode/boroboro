import { Module } from '@nestjs/common';
import { MessagingService } from './messaging.service';
import { MessagingController } from './messaging.controller';
import { ConversationsController } from './conversations.controller';

@Module({
  controllers: [MessagingController, ConversationsController],
  providers: [MessagingService],
  exports: [MessagingService],
})
export class MessagingModule {}
