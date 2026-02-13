import { Module } from '@nestjs/common';
import { PostsService } from './posts.service';
import { PostsController } from './posts.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Post, PostSchema } from './schemas/post.schema';
import { FileUploadModule } from '../file-upload/file-upload.module';
import { Comment, CommentSchema } from './schemas/comment.schema';

@Module({
  imports: [MongooseModule.forFeature([{ name: Post.name, schema: PostSchema },
    { name: Comment.name, schema: CommentSchema },
  ]), FileUploadModule],
  providers: [PostsService],
  controllers: [PostsController],
})
export class PostsModule {}
