import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import type { INestApplication } from '@nestjs/common';
import { AppModule } from './app.module.js';

export async function createApp(): Promise<INestApplication> {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  // Enable CORS
  const corsOrigin = process.env.CORS_ORIGIN ?? '*';
  app.enableCors({
    origin: corsOrigin === '*' ? true : corsOrigin.split(',').map((o) => o.trim()),
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: false,
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // OpenAPI Swagger Documentation
  const config = new DocumentBuilder()
    .setTitle('Susi Air Pilot App API')
    .setDescription(
      'REST API backend for Susi Air Pilot App. Powered by NestJS and OAuth 2.0 Bearer token authentication.',
    )
    .setVersion('1.0.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'Authorization',
        description: 'Enter your OAuth 2.0 Bearer access token here',
        in: 'header',
      },
      'JWT-auth',
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  // Initialize the app WITHOUT calling app.listen().
  // In serverless (Vercel) we delegate (req, res) to the underlying HTTP adapter;
  // in standalone mode, main.ts calls app.listen() instead.
  await app.init();

  logger.log(`🚀 Susi Air Pilot API application initialized`);
  if (process.env.NODE_ENV !== 'production') {
    const port = parseInt(process.env.PORT ?? '3000', 10);
    logger.log(`📖 API Documentation available on http://localhost:${port}/docs`);
  }

  return app;
}
