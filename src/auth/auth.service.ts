import { Injectable } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { CreateUserDto } from 'src/users/dto/create-user.dto';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService
  ) {}

  async validateUser(email: string, pass: string): Promise<any> {
    const user = await this.usersService.findOne(email);
    if (user && await bcrypt.compare(pass, user.password)) {
      const { password, ...result } = user;
      return result;
    }
    return null;
  }

  async login(user: any, loginDirectlyAfterSignup: boolean = false) {
    if (loginDirectlyAfterSignup) {
      const u: any = await this.usersService.findOne(user.email);
      const payload = { 
        email: user.email, 
        sub: u._id,
        username: u.username // Still include username in the payload if needed for other services
      };
       return {
      access_token: this.jwtService.sign(payload, { secret: 'JWT_SECRET', expiresIn: '1h' }),
    };
    } else {
       const u: any = await this.usersService.findOne(user.username);
      const payload = { 
        email: u.email, 
        sub: u._id,
        username: u.username // Still include username in the payload if needed for other services
      };
       return {
      access_token: this.jwtService.sign(payload, { secret: 'JWT_SECRET', expiresIn: '1h' }),
    };

    }

    
   
  }

  async signup(createUserDto: CreateUserDto) {
    const user = await this.usersService.create(createUserDto);
    return this.login(user, true);
  }

  async getProfile(userId: string) {
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }
    // Exclude password from the returned user object
    const { password, ...result } = user['_doc'] || user;
    return result;
  }
}
