import { Controller, Req, Get, Post, Delete, Param, Patch, Body, UseGuards, Request, Query, UseInterceptors, UploadedFile, HttpException, HttpStatus } from '@nestjs/common';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { AuthGuard } from '@nestjs/passport';
import { FileInterceptor } from '@nestjs/platform-express';
import { FileUploadService } from '../file-upload/file-upload.service';
import { SearchUsersDto } from './dto/search-users.dto';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService,
    private readonly fileUploadService: FileUploadService,

  ) { }

  @Get('search')
  @UseGuards(AuthGuard('jwt'))
  async searchUsers(@Query() searchUsersDto: SearchUsersDto) {
    if (!searchUsersDto.q || searchUsersDto.q.trim() === '') {
      return [];
    }

    return this.usersService.searchUsers(searchUsersDto.q.trim());
  }

  @UseGuards(AuthGuard('jwt'))
  @Get(':id')
  async findOne(@Param('id') id: string) {
    const user = await this.usersService.findById(id);
    if (!user) {
      throw new Error('User not found');
    }
    return user;
  }

  // @UseGuards(AuthGuard('jwt'))
  @Patch(':id')
  @UseInterceptors(FileInterceptor('image'))
  async update(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
    @Body() updateUserDto: UpdateUserDto,
    @Request() req,
  ) {
    if (file) {
      const uploadResult = await this.fileUploadService.uploadImage(file);
      updateUserDto.avatar = uploadResult.filePath;
    }

    const updatedUser = await this.usersService.update(id, updateUserDto);
    if (!updatedUser) {
      throw new Error('User not found');
    }
    return updatedUser;
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('follow/:id')
  async followUser(@Param('id') targetUserId: string, @Req() req) {
    try {
      return await this.usersService.followUser(req.user.userId, targetUserId);
    } catch (error) {
      if (error.message === 'User not found') {
        throw new HttpException(error.message, HttpStatus.NOT_FOUND);
      }
      if (error.message === 'Already following this user') {
        throw new HttpException(error.message, HttpStatus.CONFLICT);
      }
      throw new HttpException('Failed to follow user', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('unfollow/:id')
  async unfollowUser(@Param('id') targetUserId: string, @Req() req) {
    try {
      return await this.usersService.unfollowUser(req.user.userId, targetUserId);
    } catch (error) {
      if (error.message === 'User not found') {
        throw new HttpException(error.message, HttpStatus.NOT_FOUND);
      }
      if (error.message === 'Not following this user') {
        throw new HttpException(error.message, HttpStatus.CONFLICT);
      }
      throw new HttpException('Failed to unfollow user', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get(':id/followers')
  async getFollowers(@Param('id') userId: string) {
    try {
      return await this.usersService.getFollowers(userId);
    } catch (error) {
      if (error.message === 'User not found') {
        throw new HttpException(error.message, HttpStatus.NOT_FOUND);
      }
      throw new HttpException('Failed to get followers', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get(':id/following')
  async getFollowing(@Param('id') userId: string) {
    try {
      return await this.usersService.getFollowing(userId);
    } catch (error) {
      if (error.message === 'User not found') {
        throw new HttpException(error.message, HttpStatus.NOT_FOUND);
      }
      throw new HttpException('Failed to get following', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get(':id/follow-stats')
  async getFollowStats(@Param('id') userId: string) {
    try {
      return await this.usersService.getFollowStats(userId);
    } catch (error) {
      if (error.message === 'User not found') {
        throw new HttpException(error.message, HttpStatus.NOT_FOUND);
      }
      throw new HttpException('Failed to get follow stats', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @UseGuards(AuthGuard('jwt'))
  @Get(':id/is-following')
  async isFollowing(@Param('id') targetUserId: string, @Req() req) {
    try {
      const isFollowing = await this.usersService.isFollowing(req.user.userId, targetUserId);
      return { isFollowing };
    } catch (error) {
      if (error.message === 'User not found') {
        throw new HttpException(error.message, HttpStatus.NOT_FOUND);
      }
      throw new HttpException('Failed to check follow status', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
