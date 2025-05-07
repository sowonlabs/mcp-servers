import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

// Run with STDIO
async function bootstrapStdio() {
  const enableLogging = process.argv.includes('--log') || process.argv.includes('-l');
  
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: enableLogging ? ['error', 'warn', 'debug', 'log'] : false
  });
  
  // Error handling
  process.on('uncaughtException', (err) => {
    console.error('Unexpected error:', err);
  });
  
  return app; // Return application context (do not exit)
}

void bootstrapStdio();
