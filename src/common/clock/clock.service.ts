import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class ClockService implements OnModuleInit {
  private readonly appToday: string;

  constructor(private readonly configService: ConfigService) {
    this.appToday = this.configService.get<string>('appToday') ?? process.env.APP_TODAY ?? '2026-05-15';
  }

  onModuleInit() {
    this.validateDateFormat(this.appToday);
  }

  today(): string {
    return this.appToday;
  }

  validateDateFormat(dateStr: string): void {
    const regex = /^\d{4}-\d{2}-\d{2}$/;
    if (!regex.test(dateStr)) {
      throw new Error(`Invalid date format for APP_TODAY: "${dateStr}". Must be YYYY-MM-DD.`);
    }

    const [year, month, day] = dateStr.split('-').map(Number);
    const date = new Date(Date.UTC(year, month - 1, day));
    if (
      date.getUTCFullYear() !== year ||
      date.getUTCMonth() !== month - 1 ||
      date.getUTCDate() !== day
    ) {
      throw new Error(`Invalid calendar date for APP_TODAY: "${dateStr}".`);
    }
  }

  addDays(iso: string, n: number): string {
    const [year, month, day] = iso.split('-').map(Number);
    const date = new Date(Date.UTC(year, month - 1, day + n));
    return date.toISOString().slice(0, 10);
  }

  diffDays(targetDate: string, baseDate: string): number {
    const [y1, m1, d1] = targetDate.split('-').map(Number);
    const [y2, m2, d2] = baseDate.split('-').map(Number);

    const utc1 = Date.UTC(y1, m1 - 1, d1);
    const utc2 = Date.UTC(y2, m2 - 1, d2);

    const msPerDay = 1000 * 60 * 60 * 24;
    return Math.round((utc1 - utc2) / msPerDay);
  }

  eachDay(from: string, to: string): string[] {
    const days: string[] = [];
    const total = this.diffDays(to, from);
    if (total < 0) {
      return days;
    }

    for (let i = 0; i <= total; i++) {
      days.push(this.addDays(from, i));
    }
    return days;
  }
}
