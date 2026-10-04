import { Injectable } from '@nestjs/common';
import { DataStoreService } from '../common/data-store/data-store.service.js';

@Injectable()
export class PilotService {
  constructor(private readonly store: DataStoreService) {}

  getProfile() {
    return {
      name: this.store.pilot.name,
      totalFlightHours: this.store.pilot.totalFlightHours,
      avatarUrl:
        'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=256&q=80',
    };
  }
}
