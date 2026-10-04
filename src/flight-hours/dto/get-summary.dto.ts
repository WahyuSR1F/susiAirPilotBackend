import { IsIn, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export type SummaryRange = '1w' | '1m' | '3m' | '6m' | '1y';

export class GetSummaryDto {
  @ApiProperty({
    description: 'Rolling sum window range',
    enum: ['1w', '1m', '3m', '6m', '1y'],
    example: '1w',
  })
  @IsNotEmpty()
  @IsIn(['1w', '1m', '3m', '6m', '1y'], {
    message: 'range must be one of: 1w, 1m, 3m, 6m, 1y',
  })
  range!: SummaryRange;
}
