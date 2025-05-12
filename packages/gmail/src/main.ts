import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger } from '@nestjs/common';
import yargs from 'yargs/yargs';
import { hideBin } from 'yargs/helpers';

const logger = new Logger('Bootstrap');

// Set credentials file path as an environment variable
const args = yargs(hideBin(process.argv))
  .options({
    log: {
      alias: 'l',
      type: 'boolean',
      describe: 'Enable logging',
      default: false
    },
    credentials: {
      type: 'string',
      description: 'Path to credentials.json file',
      demandOption: false,
    },
  })
  .parseSync();

// Set credentials path as environment variable if provided
if (args.credentials) {
  process.env.GOOGLE_CREDENTIALS_PATH = args.credentials;
}

// Run in STDIO mode
async function bootstrapStdio() {
  const enableLogging = args.log || false;
  
  try {
    const app = await NestFactory.createApplicationContext(AppModule, {
      logger: enableLogging ? ['error', 'warn', 'debug', 'log'] : false
    });
    
    // Error handling
    process.on('uncaughtException', (err) => {
      logger.error('Unexpected error occurred:', err);
    });
    
    process.on('SIGINT', async () => {
      logger.log('Shutting down application...');
      await app.close();
      process.exit(0);
    });
    
    logger.log('Gmail MCP server initialized successfully');
    // MCP server handles STDIO streams internally, so don't close the app
    return app;
  } catch (error) {
    logger.error('Error occurred during MCP server initialization:', error);
    process.exit(1);
  }
}

void bootstrapStdio();