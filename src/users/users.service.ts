import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from './schemas/user.schema';
import { CreateUserDto } from './dto/create-user.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) { }

  async create(createUserDto: CreateUserDto): Promise<User> {
    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);
    const createdUser = new this.userModel({ ...createUserDto, password: hashedPassword });
    return createdUser.save();
  }

  async findOne(email: string): Promise<User | undefined> {
    const user = await this.userModel.findOne({ email }).exec();
    return user ?? undefined;
  }

  async findByUsername(username: string): Promise<User | undefined> {
    const user = await this.userModel.findOne({ username }).exec();
    return user ?? undefined;
  }

  async findById(id: string): Promise<User | undefined> {
    const user = await this.userModel.findById(id).exec();
    return user ?? undefined;
  }

  async update(id: string, updateUserDto: any): Promise<User | null> {
    // If password is being updated, hash it
    if (updateUserDto.password) {
      updateUserDto.password = await bcrypt.hash(updateUserDto.password, 10);
    }
    const updatedUser = await this.userModel
      .findByIdAndUpdate(
        id,
        { $set: updateUserDto },
        { new: true }
      )
      .select('-password') // Exclude password from the returned user
      .exec();

    return updatedUser;
  }

  async searchUsers(query: string) {
    const searchRegex = new RegExp(query, 'i'); // Case-insensitive search

    return this.userModel.find({
      $or: [
        { username: { $regex: searchRegex } },
        { email: { $regex: searchRegex } },
      ],
    }).select('_id username avatar').exec();
  }

  async followUser(currentUserId: string, targetUserId: string) {
    // Check if target user exists
    const targetUser = await this.userModel.findById(targetUserId);
    if (!targetUser) {
      throw new NotFoundException('User not found');
    }
    // Check if already following
    const currentUser: any = await this.userModel.findById(currentUserId);
    if (currentUser?.following.includes((targetUserId))) {
      throw new Error('Already following this user');
    }
    // Add to following list of current user
    await this.userModel.findByIdAndUpdate(
      currentUserId,
      { $push: { following: targetUserId } },
      { new: true }
    );
    // Add to followers list of target user
    await this.userModel.findByIdAndUpdate(
      targetUserId,
      { $push: { followers: currentUserId } },
      { new: true }
    );
    return await this.userModel
      .findById(currentUserId)
      .populate({
        path: 'following',
        select: 'username avatar',
        model: 'User'
      })
      .select('following')
      .exec();
  }

  async unfollowUser(currentUserId: string, targetUserId: string) {
    // Check if target user exists
    const targetUser = await this.userModel.findById(targetUserId);
    if (!targetUser) {
      throw new NotFoundException('User not found');
    }
    // Check if not following
    const currentUser: any = await this.userModel.findById(currentUserId);
    if (!currentUser?.following.includes(targetUserId)) {
      throw new Error('Not following this user');
    }
    // Remove from following list of current user
    await this.userModel.findByIdAndUpdate(
      currentUserId,
      { $pull: { following: targetUserId } },
      { new: true }
    );
    // Remove from followers list of target user
    await this.userModel.findByIdAndUpdate(
      targetUserId,
      { $pull: { followers: currentUserId } },
      { new: true }
    );
    return await this.userModel
      .findById(currentUserId)
      .populate({
        path: 'following',
        select: 'username avatar',
        model: 'User'
      })
      .select('following')
      .exec();
    // return { success: true, message: 'User unfollowed successfully' };
  }

  async getFollowers(userId: string) {
    const user = await this.userModel
      .findById(userId)
      .populate({
        path: 'followers',
        select: 'username avatar',
        model: 'User'
      })
      .select('followers')
      .exec();
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user.followers;
  }

  async getFollowing(userId: string) {
    const user = await this.userModel
      .findById(userId)
      .populate({
        path: 'following',
        select: 'username avatar',
        model: 'User'
      })
      .select('following')
      .exec();
    console.log('following', user);

    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user.following;
  }

  async getFollowStats(userId: string) {
    const user = await this.userModel
      .findById(userId)
      .select('followers following')
      .lean()
      .exec();
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return {
      followersCount: user.followers.length,
      followingCount: user.following.length
    };
  }

  async isFollowing(currentUserId: string, targetUserId: string) {
    const currentUser: any = await this.userModel
      .findById(currentUserId)
      .select('following')
      .lean()
      .exec();
    if (!currentUser) {
      throw new NotFoundException('User not found');
    }
    return currentUser.following.includes(targetUserId);
  }
}
