import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class HideReviewDto {
  @ApiPropertyOptional({
    example: 'Spam or inappropriate language',
    description: 'Optional reason for hiding the review',
  })
  @IsOptional()
  @IsString()
  reason?: string;
}
