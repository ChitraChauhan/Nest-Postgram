import { Injectable } from '@nestjs/common';

@Injectable()
export class ConfigService {
  get mongoUri(): string {
    return 'mongodb://localhost:27017/instagram';
  }

  get jwtSecret(): string {
    return 'JWT_SECRET';
  }
}
