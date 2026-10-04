import { Injectable } from '@nestjs/common';
import { DataStoreService } from '../common/data-store/data-store.service.js';
import { ClockService } from '../common/clock/clock.service.js';
import type { LegendItem } from '../common/data-store/data-store.service.js';

export interface EnrichedScheduleItem {
  id: string;
  duty_date: string;
  status: number;
  base_name: string;
  base_color: string;
  duty_type: string;
  count_schedules: number;
  count_logbooks: number;
  remaining: number;
  completed: boolean;
}

export interface SchedulesResponse {
  year: number;
  month: number;
  today: string;
  legend: LegendItem[];
  items: EnrichedScheduleItem[];
}

@Injectable()
export class SchedulesService {
  constructor(
    private readonly store: DataStoreService,
    private readonly clock: ClockService,
  ) {}

  getByMonth(year: number, month: number): SchedulesResponse {
    const today = this.clock.today();
    const monthPadded = month.toString().padStart(2, '0');
    const prefix = `${year}-${monthPadded}`;

    const filtered = this.store.schedules.filter((s) => s.duty_date.startsWith(prefix));

    // Sort ascending by duty_date
    filtered.sort((a, b) => a.duty_date.localeCompare(b.duty_date));

    const items: EnrichedScheduleItem[] = filtered.map((s) => {
      const remaining = Math.max(s.count_schedules - s.count_logbooks, 0);
      const completed = s.count_logbooks === s.count_schedules;

      return {
        id: s.id,
        duty_date: s.duty_date,
        status: s.status,
        base_name: s.base_name,
        base_color: s.base_color,
        duty_type: s.duty_type,
        count_schedules: s.count_schedules,
        count_logbooks: s.count_logbooks,
        remaining,
        completed,
      };
    });

    return {
      year,
      month,
      today,
      legend: this.store.legend,
      items,
    };
  }
}
