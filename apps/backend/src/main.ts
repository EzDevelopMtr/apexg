import 'reflect-metadata';

import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';

import { AppModule } from './app.module.js';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);

  // Permite que OnApplicationShutdown se dispare ante SIGINT/SIGTERM
  // (necesario para cerrar el pool de PostgreSQL de forma limpia).
  app.enableShutdownHooks();

  // Validación de DTOs con class-validator. `whitelist` elimina campos no
  // declarados; `forbidNonWhitelisted` rechaza el request si los trae;
  // `transform` instancia el DTO.
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const config = app.get(ConfigService);
  const port = Number(config.get<string>('PORT')) || 3001;

  await app.listen(port);
}

void bootstrap();
