import { DynamicModule, Module } from '@nestjs/common';
import { DiscoveryModule } from '@nestjs/core';
import { McpAdapterModule } from '@sowonai/nestjs-mcp-adapter';
import { GoogleOAuthModule, FileSystemTokenRepository, TokenRepository } from '@sowonai/nestjs-google-oauth-integration';
import { GmailService } from './gmail.service';
import { GmailTool } from './gmail.tool';
import { McpController } from './mcp.controller';
import { CliOptions } from "./cli-options";
import { SERVER_NAME } from './constants';
import { StderrLogger } from './stderr.logger';
import { InstallService } from './install.service'; // InstallService 임포트 추가

const GMAIL_SCOPES = [
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/gmail.send',
  'https://www.googleapis.com/auth/gmail.compose',
  'https://www.googleapis.com/auth/gmail.modify',
];

@Module({})
export class AppModule {
  static forRoot(args: CliOptions): DynamicModule {
    return {
      module: AppModule,
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
          scopes: GMAIL_SCOPES,
          logging: {
            enabled: args.log || false,
          }
        }),
      ],
      controllers: [McpController],
      providers: [
        GmailTool,
        GmailService,
        StderrLogger,
        InstallService,
      ],
      exports: [GmailService],
    };
  }
}
