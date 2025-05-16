import {INestApplicationContext, Logger, LoggerService} from '@nestjs/common';
import { AppModule } from '../src/app.module';
import { Test, TestingModule } from '@nestjs/testing';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { GoogleOAuthService } from '@sowonai/nestjs-google-oauth-integration';
import {NestFactory} from "@nestjs/core";

describe('AuthService Integration Test (Full Application)', () => {
  let appContext: INestApplicationContext;
  let authService: GoogleOAuthService;

  beforeAll(async () => {
    // const moduleRef: TestingModule = await Test.createTestingModule({
    //   imports: [AppModule]
    // }).compile();

    // Logger.overrideLogger(new MyLoggerService());

    const enableLogging = false;
    const app = await NestFactory.createApplicationContext(AppModule, {
      logger: enableLogging ? ['error', 'warn', 'debug', 'log'] : false
    });

    await app.init();

    // appContext = moduleRef.createNestApplication();
    // await appContext.init();
    
    authService = app.get<GoogleOAuthService>(GoogleOAuthService);
  });

  afterAll(async () => {
    await appContext.close();
    console.log('Application context closed.');
  });

  // Actual authentication test
  it('hello test', async () => {
    authService.hello();
  }, 60_000);
  
});

