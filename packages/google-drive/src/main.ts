import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger } from '@nestjs/common';
import { parseCliOptions } from "./cli-options";
import { StdioExpressAdapter } from '@sowonai/nestjs-mcp-adapter';
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
        logger: args.log ? new StderrLogger('DriveAuthCli', { timestamp: true }) : false,
      });
      
      const installService = app.get(InstallService);
      await installService.runInstallScript(SERVER_NAME, '@sowonai/mcp-google-drive');
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

    if (args.protocol === 'HTTP') { // HTTP 프로토콜 지원 추가
      app = await NestFactory.create(AppModule.forRoot(args), {
        logger: args.log ? ['error', 'warn', 'debug', 'log'] : false
      });
    } else {
      adapter = new StdioExpressAdapter('/mcp');
      app = await NestFactory.create(AppModule.forRoot(args), adapter, {
        logger: args.log ? new StderrLogger(
          'DriveServer',
          { timestamp: true }
        ) : false,
      });
    }

    await app.init();
    await app.listen(args.port);

    process.on('uncaughtException', (err) => {
      logger.error('Unexpected error occurred:', err);
    });

    process.on('SIGINT', async () => {
      logger.log('Shutting down application...');
      await app.close();
      process.exit(0);
    });

    if (args.protocol === 'HTTP') {
      logger.log(`Application is running on: http://localhost:${args.port}/mcp`);
    } else {
      logger.log('Application is running in STDIO mode');
    }
    
    logger.log('Google Drive MCP server initialized successfully');
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
