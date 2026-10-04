import { Module, Global } from '@nestjs/common';
import { DataStoreService } from './data-store.service.js';

@Global()
@Module({
  providers: [DataStoreService],
  exports: [DataStoreService],
})
export class DataStoreModule {}
