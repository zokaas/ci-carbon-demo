import { IsInt, IsPositive, IsIn, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateOrderDto {
  @ApiProperty()
  @IsInt()
  @IsPositive()
  userId: number;

  @ApiProperty()
  @IsInt()
  @IsPositive()
  productId: number;

  @ApiProperty({ default: 1 })
  @IsInt()
  @IsPositive()
  quantity: number;

  @ApiProperty({ enum: ['pending', 'confirmed', 'cancelled'], required: false })
  @IsOptional()
  @IsIn(['pending', 'confirmed', 'cancelled'])
  status?: 'pending' | 'confirmed' | 'cancelled';
}
