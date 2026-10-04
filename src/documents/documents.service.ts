import { Injectable } from '@nestjs/common';
import { DataStoreService } from '../common/data-store/data-store.service.js';
import { ClockService } from '../common/clock/clock.service.js';

export interface DocumentItemResponse {
  id: string;
  label: string;
  expiryDate: string;
  daysRemaining: number;
  status: 'expired' | 'soon' | 'safe';
}

export interface DocumentsResponse {
  today: string;
  warningDays: number;
  items: DocumentItemResponse[];
}

@Injectable()
export class DocumentsService {
  constructor(
    private readonly store: DataStoreService,
    private readonly clock: ClockService,
  ) {}

  getAll(): DocumentsResponse {
    const today = this.clock.today();
    const warningDays = this.store.docThresholds.warningDays;

    const items: DocumentItemResponse[] = this.store.documents.map((doc) => {
      const daysRemaining = this.clock.diffDays(doc.expiryDate, today);

      let status: 'expired' | 'soon' | 'safe';
      if (daysRemaining <= 0) {
        status = 'expired';
      } else if (daysRemaining <= warningDays) {
        status = 'soon';
      } else {
        status = 'safe';
      }

      return {
        id: doc.id,
        label: doc.label,
        expiryDate: doc.expiryDate,
        daysRemaining,
        status,
      };
    });

    // Sort ascending by daysRemaining (most urgent first)
    items.sort((a, b) => a.daysRemaining - b.daysRemaining);

    return {
      today,
      warningDays,
      items,
    };
  }
}
