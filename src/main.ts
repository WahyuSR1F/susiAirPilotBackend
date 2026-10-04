import { createApp } from './bootstrap.js';

async function bootstrap() {
  const port = parseInt(process.env.PORT ?? '3000', 10);
  const app = await createApp();
  await app.listen(port, '0.0.0.0');
}

await bootstrap();
