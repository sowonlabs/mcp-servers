import { Module } from '@nestjs/common';
import { DiscoveryModule } from '@nestjs/core';
import { McpAdapterModule } from '@sowonai/nestjs-mcp-adapter';
import { AuthTool } from './auth.tool';
import { GoogleOAuthModule, FileSystemTokenRepository } from '@sowonai/nestjs-google-oauth-integration';
import { GmailService } from './gmail.service';
import { GmailTool } from './gmail.tool';
import { McpController } from './mcp.controller';
import { parseCliOptions } from "./cli-options";
import * as path from 'path';
import * as os from 'os';

// Set credentials file path as an environment variable
const args = parseCliOptions();

const tokenDir = path.join(os.homedir(), '.sowonai');

@Module({
  imports: [
    DiscoveryModule,
    McpAdapterModule.forRoot(),
    GoogleOAuthModule.forRoot({
      name: 'mcp-gmail',
      credentialsFilename: args.credentials || 'credentials.json',
      tokenRepository: new FileSystemTokenRepository({
        tokenDir: tokenDir,
        tokenPath: path.join(tokenDir, 'gmail-token.json')
      }),
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
  providers: [AuthTool, GmailTool, GmailService],
})
export class AppModule {}