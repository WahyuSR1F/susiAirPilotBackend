import { describe, it, expect, beforeEach } from 'vitest';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';

describe('AppController', () => {
  let appController: AppController;

  beforeEach(() => {
    const appService = new AppService();
    appController = new AppController(appService);
  });

  describe('root', () => {
    it('should return welcome status object', () => {
      expect(appController.getRoot()).toEqual({
        name: 'Susi Air Pilot App API',
        status: 'healthy',
        version: '1.0.0',
        docs: '/docs',
      });
    });

    it('should return health status', () => {
      const health = appController.getHealth();
      expect(health.status).toBe('ok');
      expect(health.uptime).toBeGreaterThanOrEqual(0);
    });
  });
});
