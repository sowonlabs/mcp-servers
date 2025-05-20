import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { StdioExpressAdapter } from '@sowonai/nestjs-mcp-adapter';
import { Logger } from '@nestjs/common';
import { parseCliOptions } from "./cli-options";

const logger = new Logger('Bootstrap');

const args = parseCliOptions();

async function bootstrap() {
  try {
    let app;

    if (args.protocol === 'HTTP') {
      app = await NestFactory.create(AppModule, {
        logger: args.log ? ['error', 'warn', 'debug', 'log'] : false
      });
    } else {
      const adapter = new StdioExpressAdapter('/mcp');
      app = await NestFactory.create(AppModule, adapter, {
        logger: args.log ? ['error', 'warn', 'debug', 'log'] : false
      });
    }


    await app.init();
    await app.listen(args.port);

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

void bootstrap();