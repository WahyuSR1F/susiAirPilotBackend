import { IsNotEmpty, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class GetFlightHoursDto {
  @ApiProperty({
    description: 'Start date in format YYYY-MM-DD',
    example: '2026-05-01',
  })
  @IsNotEmpty()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'from must be formatted as YYYY-MM-DD',
  })
  from!: string;

  @ApiProperty({
    description: 'End date in format YYYY-MM-DD',
    example: '2026-05-15',
  })
  @IsNotEmpty()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'to must be formatted as YYYY-MM-DD',
  })
  to!: string;
}
