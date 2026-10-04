import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { FlightHoursService } from './flight-hours.service.js';
import { GetFlightHoursDto } from './dto/get-flight-hours.dto.js';
import { GetSummaryDto } from './dto/get-summary.dto.js';

@ApiTags('Flight Hours')
@ApiBearerAuth('JWT-auth')
@Controller('flight-hours')
export class FlightHoursController {
  constructor(private readonly flightHoursService: FlightHoursService) {}

  @Get('summary')
  @ApiOperation({
    summary: 'Get rolling sum series for trend chart and limit summary cards',
  })
  @ApiResponse({
    status: 200,
    description: '15-point rolling sum series and 4 limit cards',
    schema: {
      example: {
        range: '1w',
        windowDays: 7,
        limit: 40,
        yMax: 45,
        today: '2026-05-15',
        series: [
          {
            date: '2026-05-08',
            hours: 5.2,
            rollingSum: 15.0,
            isToday: false,
            isFuture: false,
            partialWindow: false,
            overLimit: false,
          },
          {
            date: '2026-05-15',
            hours: 6.4,
            rollingSum: 25.2,
            isToday: true,
            isFuture: false,
            partialWindow: false,
            overLimit: false,
          },
        ],
        cards: [
          {
            key: 'daily',
            label: 'Daily',
            windowDays: 1,
            hours: 6.4,
            limit: 8,
            percent: 80.0,
            overLimit: false,
          },
          {
            key: 'weekly',
            label: 'Weekly',
            windowDays: 7,
            hours: 25.2,
            limit: 40,
            percent: 63.0,
            overLimit: false,
          },
          {
            key: 'monthly',
            label: 'Monthly',
            windowDays: 30,
            hours: 87.2,
            limit: 100,
            percent: 87.2,
            overLimit: false,
          },
          {
            key: 'annual',
            label: 'Annual',
            windowDays: 365,
            hours: 1013.8,
            limit: 1050,
            percent: 96.5,
            overLimit: false,
          },
        ],
      },
    },
  })
  getSummary(@Query() query: GetSummaryDto) {
    return this.flightHoursService.getSummary(query.range);
  }

  @Get()
  @ApiOperation({ summary: 'Get daily flight hours within a date range' })
  @ApiResponse({
    status: 200,
    description: 'Daily flight hours list for the requested date range',
    schema: {
      example: {
        from: '2026-05-01',
        to: '2026-05-03',
        items: [
          { date: '2026-05-01', hours: 3.8 },
          { date: '2026-05-02', hours: 0 },
          { date: '2026-05-03', hours: 0 },
        ],
      },
    },
  })
  getDaily(@Query() query: GetFlightHoursDto) {
    return this.flightHoursService.getDaily(query.from, query.to);
  }
}
