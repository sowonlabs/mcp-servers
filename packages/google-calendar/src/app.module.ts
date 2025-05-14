import { Module } from '@nestjs/common';
import { McpModule, McpTransportType } from '@rekog/mcp-nest';
import { AuthTool } from './auth.tool';
import { GoogleOAuthModule, FileSystemTokenRepository } from '@sowonai/nestjs-google-oauth-integration';
import { CalendarService } from './calendar.service';
import { CalendarTool } from './calendar.tool';
import { parseCliOptions } from './cli-options';
import * as path from 'path';
import * as os from 'os';

// Set credentials file path as an environment variable
const args = parseCliOptions();

const tokenDir = path.join(os.homedir(), '.sowonai');

@Module({
  imports: [
    McpModule.forRoot({
      name: 'mcp-google-calendar',
      version: '0.1.0',
      transport: McpTransportType.STDIO,
    }),
    GoogleOAuthModule.forRoot({
      name: 'mcp-google-calendar',
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
  providers: [AuthTool, CalendarTool, CalendarService],
})
export class AppModule {}

