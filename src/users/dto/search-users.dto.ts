// users/dto/search-users.dto.ts
import { IsString, IsOptional } from 'class-validator';

export class SearchUsersDto {
  @IsString()
  @IsOptional()
  q: string;
}