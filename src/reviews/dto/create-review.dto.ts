import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsString, IsUUID, Max, Min } from 'class-validator';

export class CreateReviewDto {
  @ApiProperty({
    example: '4371668d-135c-43e3-9174-6c24f692820d',
    description: 'ID of the product being reviewed',
  })
  @IsUUID()
  @IsNotEmpty()
  productId!: string;

  @ApiProperty({
    example: '80791be8-db70-4668-a481-859cffa4c3b3',
    description: 'ID of the delivered order that contains the product',
  })
  @IsUUID()
  @IsNotEmpty()
  orderId!: string;

  @ApiProperty({
    example: 5,
    description: 'Rating value from 1 to 5',
    minimum: 1,
    maximum: 5,
  })
  @IsInt()
  @Min(1)
  @Max(5)
  rating!: number;

  @ApiProperty({
    example: 'Amazing phone',
    description: 'Review comment text',
  })
  @IsString()
  @IsNotEmpty()
  comment!: string;
}
