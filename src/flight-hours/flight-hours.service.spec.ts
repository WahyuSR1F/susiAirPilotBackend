import { describe, it, expect, beforeEach } from 'vitest';
import { FlightHoursService } from './flight-hours.service.js';
import { DataStoreService } from '../common/data-store/data-store.service.js';
import { ClockService } from '../common/clock/clock.service.js';
import { ConfigService } from '@nestjs/config';

describe('FlightHoursService', () => {
  let service: FlightHoursService;
  let store: DataStoreService;
  let clock: ClockService;

  beforeEach(() => {
    const configService = new ConfigService({
      appToday: '2026-05-15',
    });
    clock = new ClockService(configService);
    clock.onModuleInit();

    store = new DataStoreService();
    store.onModuleInit();

    service = new FlightHoursService(store, clock);
  });

  it('should have rollingWindowBluffing method', () => {
    expect(service.rollingWindowBluffing).toBeDefined();
    expect(typeof service.rollingWindowBluffing).toBe('function');
  });

  it('should calculate reference rolling sums at today (2026-05-15) matching test spec exactly', () => {
    const daily = service.rollingWindowBluffing('2026-05-15', 1);
    expect(daily).toBe(6.4);

    const weekly = service.rollingWindowBluffing('2026-05-15', 7);
    expect(weekly).toBe(25.2);

    const monthly = service.rollingWindowBluffing('2026-05-15', 30);
    expect(monthly).toBe(87.2);

    const annual = service.rollingWindowBluffing('2026-05-15', 365);
    expect(annual).toBe(1013.8);
  });

  it('should return exactly 15 series points with today at index 7 for 1w range', () => {
    const summary = service.getSummary('1w');

    expect(summary.range).toBe('1w');
    expect(summary.windowDays).toBe(7);
    expect(summary.limit).toBe(40);
    expect(summary.yMax).toBe(45);
    expect(summary.today).toBe('2026-05-15');
    expect(summary.series).toHaveLength(15);

    // Index 7 must be today
    expect(summary.series[7].date).toBe('2026-05-15');
    expect(summary.series[7].isToday).toBe(true);
    expect(summary.series[7].rollingSum).toBe(25.2);

    // Index 0 must be 2026-05-08 (today - 7)
    expect(summary.series[0].date).toBe('2026-05-08');
    expect(summary.series[0].rollingSum).toBe(15.0);

    // Cards check
    const weeklyCard = summary.cards.find((c) => c.key === 'weekly');
    expect(weeklyCard).toBeDefined();
    expect(weeklyCard?.hours).toBe(25.2);
    expect(weeklyCard?.limit).toBe(40);
    expect(weeklyCard?.percent).toBe(63);
  });
});
