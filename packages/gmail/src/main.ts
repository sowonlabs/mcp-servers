import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { StdioExpressAdapter } from '@sowonai/nestjs-mcp-adapter';
import { Logger } from '@nestjs/common';
import { parseCliOptions } from "./cli-options";
import { StderrLogger } from './stderr.logger';

const logger = new Logger('Bootstrap');

const args = parseCliOptions();

async function bootstrap() {
  try {
    let app;
    let adapter: StdioExpressAdapter;

    if (args.protocol === 'HTTP') {
      app = await NestFactory.create(AppModule, {
        logger: args.log ? ['error', 'warn', 'debug', 'log'] : false
      });
    } else {
      adapter = new StdioExpressAdapter('/mcp');
      app = await NestFactory.create(AppModule, adapter, {
        logger: args.log ? new StderrLogger(
          'GmailServer',
          { timestamp: true }
        ) : false,
      });
    }

    await app.init();
    await app.listen(args.port);

    // Error handling
    process.on('uncaughtException', (err) => {
      logger.error('Unexpected error occurred:', err);
    });

    const cleanup = async () => {
      await app.close();
      if (adapter) {
        await adapter.close();
      }
    }

    process.on('SIGTERM', async () => {
      logger.log('Shutting down application...');
      await cleanup();
      process.exit(0);
    });

    process.on('SIGKILL', async () => {
      logger.log('Shutting down application...');
      await cleanup();
      process.exit(0);
    });

    process.on('SIGINT', async () => {
      logger.log('Shutting down application...');
      await cleanup();
      process.exit(0);
    });
    
    logger.log('Gmail MCP server initialized successfully');
    return app;
  } catch (error) {
    logger.error('Error occurred during MCP server initialization:', error);
    process.exit(1);
  }
}

void bootstrap();