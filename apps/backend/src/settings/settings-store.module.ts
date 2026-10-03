import { Global, Module } from '@nestjs/common';

import { SettingsService } from './settings.service.js';

/**
 * Global y sin imports: AuthModule lo necesita (módulos apagados) y el
 * controller de ajustes necesita AuthModule. Separarlo evita el ciclo.
 */
@Global()
@Module({ providers: [SettingsService], exports: [SettingsService] })
export class SettingsStoreModule {}
