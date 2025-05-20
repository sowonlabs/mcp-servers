import { Module } from '@nestjs/common';
import { McpAdapterModule } from '@sowonai/nestjs-mcp-adapter';
import { AuthTool } from './auth.tool';
import { GoogleOAuthModule, FileSystemTokenRepository } from '@sowonai/nestjs-google-oauth-integration';
import { CalendarService } from './calendar.service';
import { CalendarTool } from './calendar.tool';
import { parseCliOptions } from './cli-options';
import { McpController } from './mcp.controller';
import * as path from 'path';
import * as os from 'os';
import { SERVER_NAME } from './constants';

// Set credentials file path as an environment variable
const args = parseCliOptions();

const tokenDir = path.join(os.homedir(), '.sowonai');

@Module({
  imports: [
    McpAdapterModule.forRoot({
      servers: {
        [SERVER_NAME]: {
          version: '0.2.0',
          instructions: 'Google Calendar integration server for MCP.',
        }
      }
    }),
    GoogleOAuthModule.forRoot({
      name: SERVER_NAME,
      credentialsFilename: args.credentials || 'credentials.json',
      tokenRepository: new FileSystemTokenRepository({
        tokenDir: tokenDir,
        tokenPath: path.join(tokenDir, 'google-calendar-token.json')
      }),
      scopes: [
        'https://www.googleapis.com/auth/calendar',
        'https://www.googleapis.com/auth/calendar.events',
      ],
      logging: {
        enabled: args.log
      }
    }),
  ],
  controllers: [McpController],
  providers: [AuthTool, CalendarTool, CalendarService],
})
export class AppModule {}

