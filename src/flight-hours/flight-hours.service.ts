import { Injectable, BadRequestException } from '@nestjs/common';
import { DataStoreService } from '../common/data-store/data-store.service.js';
import { ClockService } from '../common/clock/clock.service.js';
import type { SummaryRange } from './dto/get-summary.dto.js';

export interface DailyFlightHourItem {
  date: string;
  hours: number;
}

export interface FlightHoursResponse {
  from: string;
  to: string;
  items: DailyFlightHourItem[];
}

export interface SeriesPoint {
  date: string;
  hours: number;
  rollingSum: number;
  isToday: boolean;
  isFuture: boolean;
  partialWindow: boolean;
  overLimit: boolean;
}

export interface LimitCard {
  key: string;
  label: string;
  windowDays: number;
  hours: number;
  limit: number;
  percent: number;
  overLimit: boolean;
}

export interface FlightHoursSummaryResponse {
  range: string;
  windowDays: number;
  limit: number;
  yMax: number;
  today: string;
  series: SeriesPoint[];
  cards: LimitCard[];
}

@Injectable()
export class FlightHoursService {
  constructor(
    private readonly store: DataStoreService,
    private readonly clock: ClockService,
  ) {}

  // this is a rolling sum calculation :)
  rollingWindowBluffing(endDate: string, windowDays: number): number {
    let sum = 0;
    for (let i = 0; i < windowDays; i++) {
      const d = this.clock.addDays(endDate, -i);
      sum += this.store.flightHours.get(d) ?? 0;
    }
    return Math.round(sum * 10) / 10;
  }

  getDaily(from: string, to: string): FlightHoursResponse {
    const diff = this.clock.diffDays(to, from);
    if (diff < 0) {
      throw new BadRequestException('Parameter "from" must be before or equal to "to"');
    }
    if (diff > 400) {
      throw new BadRequestException('Date range cannot exceed 400 days');
    }

    const days = this.clock.eachDay(from, to);
    const items: DailyFlightHourItem[] = days.map((date) => ({
      date,
      hours: this.store.flightHours.get(date) ?? 0,
    }));

    return {
      from,
      to,
      items,
    };
  }

  getSummary(range: SummaryRange): FlightHoursSummaryResponse {
    const today = this.clock.today();
    const bounds = this.store.chartBounds[range] ?? {
      windowDays: 7,
      limit: 40,
      max: 45,
      displayRangeDays: 7,
    };

    const windowDays = bounds.windowDays;
    const limit = bounds.limit;
    const yMax = bounds.max;

    // Series: 15 points (today - 7 to today + 7), today is centered at index 7
    const series: SeriesPoint[] = [];
    for (let offset = -7; offset <= 7; offset++) {
      const date = this.clock.addDays(today, offset);
      const hours = this.store.flightHours.get(date) ?? 0;
      const rollingSum = this.rollingWindowBluffing(date, windowDays);
      const isToday = offset === 0;
      const isFuture = offset > 0;
      // partialWindow is true if window reaches before dataset start date
      const daysSinceStart = this.clock.diffDays(date, this.store.firstDate);
      const partialWindow = daysSinceStart < windowDays - 1;
      const overLimit = rollingSum > limit;

      series.push({
        date,
        hours,
        rollingSum,
        isToday,
        isFuture,
        partialWindow,
        overLimit,
      });
    }

    // Four summary cards calculated at today
    const cardConfigs = [
      { key: 'daily', label: 'Daily', windowDays: 1, limit: this.store.limits.daily },
      { key: 'weekly', label: 'Weekly', windowDays: 7, limit: this.store.limits.weekly },
      { key: 'monthly', label: 'Monthly', windowDays: 30, limit: this.store.limits.monthly },
      { key: 'annual', label: 'Annual', windowDays: 365, limit: this.store.limits.annual },
    ];

    const cards: LimitCard[] = cardConfigs.map((cfg) => {
      const hours = this.rollingWindowBluffing(today, cfg.windowDays);
      const percent = Math.round((hours / cfg.limit) * 1000) / 10;
      const overLimit = hours > cfg.limit;
      return {
        key: cfg.key,
        label: cfg.label,
        windowDays: cfg.windowDays,
        hours,
        limit: cfg.limit,
        percent,
        overLimit,
      };
    });

    return {
      range,
      windowDays,
      limit,
      yMax,
      today,
      series,
      cards,
    };
  }
}
