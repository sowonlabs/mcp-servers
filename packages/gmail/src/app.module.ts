import { Module } from '@nestjs/common';
import { DiscoveryModule } from '@nestjs/core';
import { McpAdapterModule } from '@sowonai/nestjs-mcp-adapter';
import { GoogleOAuthModule, FileSystemTokenRepository } from '@sowonai/nestjs-google-oauth-integration';
import { GmailService } from './gmail.service';
import { GmailTool } from './gmail.tool';
import { McpController } from './mcp.controller';
import { parseCliOptions } from "./cli-options";

const args = parseCliOptions();

@Module({
  imports: [
    DiscoveryModule,
    McpAdapterModule.forRoot(),
    GoogleOAuthModule.forRoot({
      name: 'mcp-gmail',
      credentialsFilename: args.credentials || 'credentials.json',
      scopes: [
        'https://www.googleapis.com/auth/gmail.readonly',
        'https://www.googleapis.com/auth/gmail.send',
        'https://www.googleapis.com/auth/gmail.compose',
        'https://www.googleapis.com/auth/gmail.modify',
      ],
      logging: {
        enabled: args.log
      }
    }),
  ],
  controllers: [McpController],
  providers: [GmailTool, GmailService],
})
export class AppModule {}