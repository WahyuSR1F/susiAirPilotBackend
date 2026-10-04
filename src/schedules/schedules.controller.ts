import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { SchedulesService } from './schedules.service.js';
import { GetSchedulesDto } from './dto/get-schedules.dto.js';

@ApiTags('Schedules')
@ApiBearerAuth('JWT-auth')
@Controller('schedules')
export class SchedulesController {
  constructor(private readonly schedulesService: SchedulesService) {}

  @Get()
  @ApiOperation({ summary: 'Get monthly pilot schedule with duty statuses and legend' })
  @ApiResponse({
    status: 200,
    description: 'Monthly schedule items with duty types and completion indicators',
    schema: {
      example: {
        year: 2026,
        month: 5,
        today: '2026-05-15',
        legend: [
          { code: 'DTY', label: 'On Duty', color: '#10B981' },
          { code: 'RLV', label: 'Requested Leave', color: '#475569' },
        ],
        items: [
          {
            id: '97027',
            duty_date: '2026-05-15',
            status: 1,
            base_name: 'MKW',
            base_color: '#10B981',
            duty_type: 'DTY',
            count_schedules: 6,
            count_logbooks: 6,
            remaining: 0,
            completed: true,
          },
        ],
      },
    },
  })
  getByMonth(@Query() query: GetSchedulesDto) {
    return this.schedulesService.getByMonth(query.year, query.month);
  }
}
