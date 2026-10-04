export default () => ({
  port: parseInt(process.env.PORT ?? '3000', 10),
  appToday: process.env.APP_TODAY ?? '2026-05-15',
  jwtSecret: process.env.JWT_SECRET ?? 'susi-air-pilot-secret-key-2026-super-secure-token',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? '86400',
  corsOrigin: process.env.CORS_ORIGIN ?? '*',
  pilotUsername: process.env.PILOT_USERNAME ?? 'johndoe',
  pilotPassword: process.env.PILOT_PASSWORD ?? 'susiairtest',
});
