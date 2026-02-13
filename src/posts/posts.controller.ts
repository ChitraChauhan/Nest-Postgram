import { Controller, Post, Get, Patch, Delete, Body, Param, UseGuards, Request, UseInterceptors, UploadedFile } from '@nestjs/common';
import { PostsService } from './posts.service';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { AuthGuard } from '@nestjs/passport';
import { FileInterceptor } from '@nestjs/platform-express';
import { FileUploadService } from '../file-upload/file-upload.service';


@Controller('posts')
export class PostsController {
  constructor(
    private readonly postsService: PostsService,
    private readonly fileUploadService: FileUploadService,
  ) { }

  @UseGuards(AuthGuard('jwt'))
  @Post()
  @UseInterceptors(FileInterceptor('image'))
  async create(
    @UploadedFile() file: Express.Multer.File,
    @Body() createPostDto: CreatePostDto,
    @Request() req,
  ) {
    if (!file) {
      throw new Error('Image is required');
    }

    // Upload the image using the file upload service
    const uploadResult = await this.fileUploadService.uploadImage(file);
    const imagePath = uploadResult.filePath;
    // Create post with the image path
    return this.postsService.create(
      { ...createPostDto, image: imagePath },
      createPostDto.userId,
    );
  }

  @Get()
  findAll() {
    return this.postsService.findAll();
  }

  @Get('user/:id')
  async getUserPost(@Param('id') id: string) {
    return await this.postsService.findByUserId(id);
  }

  @UseGuards(AuthGuard('jwt'))
  @Patch(':id')
  @UseInterceptors(FileInterceptor('image'))
  async update(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
    @Body() updatePostDto: UpdatePostDto,
    @Request() req,
  ) {
    if (file) {
      const uploadResult = await this.fileUploadService.uploadImage(file);
      updatePostDto.image = uploadResult.filePath;
    }

    // Ensure the user can only update their own posts
    // const post: any = await this.postsService.findById(id);
    // if (post.author.id !== req.user.userId) {
    //   throw new Error('You can only update your own posts');
    // }

    return this.postsService.update(id, updatePostDto);
  }

  @UseGuards(AuthGuard('jwt'))
  @Delete(':id')
  async remove(@Param('id') id: string, @Request() req) {
    // Ensure the user can only delete their own posts
    const post = await this.postsService.findById(id);

    if (post.author._id.toString() !== req.user.userId) {
      throw new Error('You can only delete your own posts');
    }

    return this.postsService.remove(id);
  }

  @UseGuards(AuthGuard('jwt'))
  @Post(':id/like')
  async likePost(
    @Param('id') postId: string,
    @Request() req
  ) {
    return this.postsService.likePost(postId, req.user.userId);
  }

  // posts/posts.controller.ts
  @UseGuards(AuthGuard('jwt'))
  @Delete(':id/like')
  async unlikePost(
    @Param('id') postId: string,
    @Request() req
  ) {
    return this.postsService.unlikePost(postId, req.user.userId);
  }

  @Get(':id/likes')
  async getPostLikes(@Param('id') postId: string) {
    return this.postsService.getPostLikes(postId);
  }

  @UseGuards(AuthGuard('jwt'))
  @Post(':id/comments')
  async addComment(
    @Param('id') postId: string,
    @Body() body: { text: string },
    @Request() req,
  ) {
    return this.postsService.addComment(postId, req.user.userId, body.text);
  }

  @UseGuards(AuthGuard('jwt'))
  @Delete('/:id/comments/:commentId')
  async deleteComment(
    @Param('commentId') commentId: string,
    @Request() req,
  ) {
    return this.postsService.deleteComment(commentId, req.user.userId);
  }

  @Get(':id/comments')
  async getPostComments(@Param('id') postId: string) {
    return this.postsService.getPostComments(postId);
  }

}