import { Module } from '@nestjs/common';
import { DiscoveryModule } from '@nestjs/core';
import { McpAdapterModule } from '@sowonai/nestjs-mcp-adapter';
import { GoogleOAuthModule } from '@sowonai/nestjs-google-oauth-integration';
import { GmailService } from './gmail.service';
import { GmailTool } from './gmail.tool';
import { McpController } from './mcp.controller';
import { parseCliOptions } from "./cli-options";
import { SERVER_NAME } from './constants';
import { StderrLogger } from './stderr.logger'; // StderrLogger 임포트

const args = parseCliOptions();

@Module({
  imports: [
    DiscoveryModule,
    McpAdapterModule.forRoot({
      servers: {
        [SERVER_NAME]: {
          version: '1.0.0',
          instructions: 'Gmail server: supports read, send, and modify emails.',
        },
      }
    }),
    GoogleOAuthModule.forRoot({
      name: SERVER_NAME,
      credentialsFilename: args.credentials || 'credentials.json',
      scopes: [
        'https://www.googleapis.com/auth/gmail.readonly',
        'https://www.googleapis.com/auth/gmail.send',
        'https://www.googleapis.com/auth/gmail.compose',
        'https://www.googleapis.com/auth/gmail.modify',
      ],
      logging: {
        enabled: false
      }
    }),
  ],
  controllers: [McpController],
  providers: [GmailTool, GmailService, StderrLogger],
})
export class AppModule {}
