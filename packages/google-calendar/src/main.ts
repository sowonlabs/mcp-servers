import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

// Run with STDIO
async function bootstrapStdio() {
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn', 'debug', 'log'],
  });
  
  // Keep the application running
  // Allow communication via STDIO without exiting
  console.log('MCP server started in STDIO mode.');
  
  // Error handling
  process.on('uncaughtException', (err) => {
    console.error('Unexpected error:', err);
  });
  
  return app; // Return application context (do not exit)
}

void bootstrapStdio();
