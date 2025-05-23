import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { StdioExpressAdapter } from '@sowonai/nestjs-mcp-adapter';
import { Logger } from '@nestjs/common';
import { parseCliOptions } from "./cli-options";
import { StderrLogger } from './stderr.logger';
import { InstallService } from './install.service';
import { SERVER_NAME } from './constants';

const logger = new Logger('Bootstrap');
const args = parseCliOptions();

async function cli() {
  try {
    if (args.install) {
      if (!args.credentials) {
        logger.error('Credentials file path is required for auth flow. Please provide it with --credentials <path>');
        process.exit(1);
      }

      const app = await NestFactory.createApplicationContext(AppModule.forRoot(args), {
        logger: args.log ? new StderrLogger('GmailAuthCli', { timestamp: true }) : false,
      });
      
      const installService = app.get(InstallService);
      await installService.runInstallScript(SERVER_NAME, '@sowonai/mcp-gmail');
      await app.close();
      process.exit(0);
    }
  } catch (error) {
    logger.error('Error occurred during MCP server initialization or auth flow:', error);
    process.exit(1);
  }
}

async function bootstrap() {
  try {
    let app;
    let adapter: StdioExpressAdapter;

    if (args.protocol === 'HTTP') {
      app = await NestFactory.create(AppModule.forRoot(args), { // Pass args to AppModule
        logger: args.log ? ['error', 'warn', 'debug', 'log'] : false
      });
    } else {
      adapter = new StdioExpressAdapter('/mcp');
      app = await NestFactory.create(AppModule.forRoot(args), adapter, { // Pass args to AppModule
        logger: args.log ? new StderrLogger(
          'GmailServer',
          { timestamp: true }
        ) : false,
      });
    }

    await app.init();
    await app.listen(args.port);

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
    logger.error('Error occurred during MCP server initialization or auth flow:', error);
    process.exit(1);
  }
}

if (args.install) {
  cli();
} else {
  bootstrap();
}
