import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Post, PostDocument } from './schemas/post.schema';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { FileUploadService } from '../file-upload/file-upload.service';
import { Comment, CommentDocument } from './schemas/comment.schema';

@Injectable()
export class PostsService {
  constructor(@InjectModel(Post.name) private postModel: Model<PostDocument>,
      @InjectModel(Comment.name) private commentModel: Model<CommentDocument>,

    private fileUploadService: FileUploadService,) { }

  async findAll(): Promise<Post[]> {
    return await this.postModel.find()
      .populate('author')
      .exec();
  }

  async create(createPostDto: CreatePostDto, userId: string): Promise<Post> {
    const createdPost = new this.postModel({
      ...createPostDto,
      author: userId,
    });
    return createdPost.save();
  }

  async update(id: string, updatePostDto: UpdatePostDto): Promise<Post | null> {
    const post = await this.postModel.findById(id).exec();
    if (!post) {
      throw new NotFoundException('Post not found');
    }

    // If there's a new image, delete the old one
    if (updatePostDto.image && post.image) {
      await this.fileUploadService.deleteFile(post.image);
    }

    const u = await this.postModel
      .findByIdAndUpdate(id, updatePostDto, { new: true })
      .populate('author', 'username avatar')
      .exec();
    return u;
  }

  async remove(id: string): Promise<void> {
    const post = await this.postModel.findByIdAndDelete(id).exec();
    if (!post) {
      throw new NotFoundException('Post not found');
    }

    // Delete the associated image
    if (post.image) {
      await this.fileUploadService.deleteFile(post.image);
    }
  }

  async findById(id: string): Promise<Post> {
    const post = await this.postModel.findById(id).populate('author').exec();
    if (!post) {
      throw new NotFoundException('Post not found');
    }
    return post;
  }

  async findByUserId(userId: string): Promise<Post[]> {
    return this.postModel
      .find({ author: userId })
      .exec();
  }

  async likePost(postId: string, userId: string): Promise<PostDocument> {
    const post = await this.postModel.findById(postId);
    if (!post) {
      throw new NotFoundException('Post not found');
    }
    const userIdObj: any = userId;
    const likeIndex = post.likes.findIndex(id => id.equals(userIdObj));
    if (likeIndex === -1) {
      // Add like
      post.likes.push(userIdObj);
      post.likeCount += 1;
    } else {
      // Remove like
      post.likes.splice(likeIndex, 1);
      post.likeCount = Math.max(0, post.likeCount - 1);
    }
    return post.save();
  }


  async unlikePost(postId: string, userId: string): Promise<PostDocument> {
    const post = await this.postModel.findById(postId);
    if (!post) {
      throw new NotFoundException('Post not found');
    }
    const userIdObj = userId;
    const likeIndex = post.likes.findIndex(id => id.equals(userIdObj));
    if (likeIndex !== -1) {
      // Remove like
      post.likes.splice(likeIndex, 1);
      post.likeCount = Math.max(0, post.likeCount - 1);
    }
    return post.save();
  }


  async getPostLikes(postId: string) {
    const post = await this.postModel
      .findById(postId)
      .populate('likes', 'username avatar')
      .select('likes likeCount')
      .exec();
    if (!post) {
      throw new NotFoundException('Post not found');
    }
    return {
      likes: post.likes,
      likeCount: post.likeCount
    };
  }

   async addComment(postId: string, userId: string, content: string) {
    const post = await this.postModel.findById(postId);
    if (!post) {
      throw new NotFoundException('Post not found');
    }
    const comment: any = new this.commentModel({
      content,
      author: userId,
      post: postId,
    });
    await comment.save();
    // Add comment to post
    post.comments.push(comment._id);
    post.commentCount += 1;
    await post.save();
    return comment.populate('author', 'username avatar');
  }

  async deleteComment(commentId: string, userId: string) {
    const comment = await this.commentModel.findOneAndDelete({
      _id: commentId,
      author: userId,
    });
    if (!comment) {
      throw new NotFoundException('Comment not found or unauthorized');
    }
    // Remove comment from post
    await this.postModel.findByIdAndUpdate(comment.post, {
      $pull: { comments: comment._id },
      $inc: { commentCount: -1 },
    });
    return { success: true };
  }

  async getPostComments(postId: string) {

  const comments = await this.commentModel
    .find({ post: postId })
    .lean()
    .exec();
  
  
  const populatedComments = await this.commentModel.populate(comments, {
    path: 'author',
    select: 'username avatar',
    model: 'User'
  });
    
  return populatedComments;
}
}

