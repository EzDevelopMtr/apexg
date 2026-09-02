import 'reflect-metadata';

import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';

import { AppModule } from './app.module.js';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);

  // Permite que OnApplicationShutdown se dispare ante SIGINT/SIGTERM
  // (necesario para cerrar el pool de PostgreSQL de forma limpia).
  app.enableShutdownHooks();

  const config = app.get(ConfigService);
  const port = Number(config.get<string>('PORT')) || 3001;

  await app.listen(port);
}

void bootstrap();
