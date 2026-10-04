import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

export interface PilotProfile {
  name: string;
  totalFlightHours: number;
}

export interface LimitsConfig {
  daily: number;
  weekly: number;
  monthly: number;
  annual: number;
}

export interface ChartBoundItem {
  limit: number;
  max: number;
  windowDays: number;
  displayRangeDays: number;
}

export interface PilotDocument {
  id: string;
  label: string;
  expiryDate: string;
}

export interface ScheduleItem {
  id: string;
  duty_date: string;
  status: number;
  base_name: string;
  base_color: string;
  duty_type: string;
  count_schedules: number;
  count_logbooks: number;
}

export interface LegendItem {
  code: string;
  label: string;
  color: string;
}

@Injectable()
export class DataStoreService implements OnModuleInit {
  private readonly logger = new Logger(DataStoreService.name);

  public readonly flightHours = new Map<string, number>();
  public pilot: PilotProfile = { name: 'John Doe', totalFlightHours: 1444.5 };
  public limits: LimitsConfig = { daily: 8, weekly: 40, monthly: 100, annual: 1050 };
  public chartBounds: Record<string, ChartBoundItem> = {};
  public documents: PilotDocument[] = [];
  public docThresholds: { warningDays: number } = { warningDays: 30 };
  public schedules: ScheduleItem[] = [];
  public legend: LegendItem[] = [];
  public firstDate: string = '2024-12-27';
  public lastDate: string = '2026-05-31';

  onModuleInit() {
    this.loadData();
  }

  private findDataDirectory(): string {
    const candidatePaths = [
      path.join(process.cwd(), 'data'),
      path.join(process.cwd(), 'susi_air_pilot_app', 'data'),
      path.join(process.cwd(), 'dist', 'data'),
      path.resolve('data'),
      path.resolve('../data'),
    ];

    for (const dir of candidatePaths) {
      if (
        fs.existsSync(path.join(dir, 'mock-flight-hours.json')) &&
        fs.existsSync(path.join(dir, 'mock-documents.json')) &&
        fs.existsSync(path.join(dir, 'mock-schedules.json'))
      ) {
        return dir;
      }
    }

    throw new Error(
      `Could not locate data directory containing mock files. Checked: ${candidatePaths.join(', ')}`,
    );
  }

  public loadData(): void {
    const dataDir = this.findDataDirectory();
    this.logger.log(`Loading JSON datasets from: ${dataDir}`);

    // 1. Flight hours
    const flightHoursRaw = fs.readFileSync(path.join(dataDir, 'mock-flight-hours.json'), 'utf-8');
    const flightHoursJson = JSON.parse(flightHoursRaw);

    if (flightHoursJson.pilot) {
      this.pilot = flightHoursJson.pilot;
    }
    if (flightHoursJson.limits) {
      this.limits = flightHoursJson.limits;
    }
    if (flightHoursJson.chartBounds) {
      this.chartBounds = flightHoursJson.chartBounds;
    }

    this.flightHours.clear();
    if (Array.isArray(flightHoursJson.flightHours) && flightHoursJson.flightHours.length > 0) {
      this.firstDate = flightHoursJson.flightHours[0].date;
      this.lastDate = flightHoursJson.flightHours[flightHoursJson.flightHours.length - 1].date;

      for (const item of flightHoursJson.flightHours) {
        this.flightHours.set(item.date, Number(item.hours));
      }
    }

    // 2. Documents
    const documentsRaw = fs.readFileSync(path.join(dataDir, 'mock-documents.json'), 'utf-8');
    const documentsJson = JSON.parse(documentsRaw);

    if (documentsJson.thresholds?.warningDays) {
      this.docThresholds = { warningDays: documentsJson.thresholds.warningDays };
    }
    if (Array.isArray(documentsJson.documents)) {
      this.documents = documentsJson.documents;
    }

    // 3. Schedules
    const schedulesRaw = fs.readFileSync(path.join(dataDir, 'mock-schedules.json'), 'utf-8');
    const schedulesJson = JSON.parse(schedulesRaw);

    if (Array.isArray(schedulesJson.legend)) {
      this.legend = schedulesJson.legend;
    }
    if (Array.isArray(schedulesJson.schedules)) {
      this.schedules = schedulesJson.schedules;
    }

    this.logger.log(
      `Loaded ${this.flightHours.size} flight days, ${this.documents.length} documents, ${this.schedules.length} schedules, ${this.legend.length} legend items.`,
    );
  }
}
