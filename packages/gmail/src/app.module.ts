import { Module } from '@nestjs/common';
import { McpModule, McpTransportType } from '@rekog/mcp-nest';
import { AuthTool } from './auth.tool';
import { GoogleOAuthModule, FileSystemTokenRepository } from '@sowonai/nestjs-google-oauth-integration';
import { GmailService } from './gmail.service';
import { GmailTool } from './gmail.tool';
import { parseCliOptions } from "./cli-options";
import * as path from 'path';
import * as os from 'os';

// Set credentials file path as an environment variable
const args = parseCliOptions();

const tokenDir = path.join(os.homedir(), '.sowonai');

@Module({
  imports: [
    McpModule.forRoot({
      name: 'mcp-gmail',
      version: '0.1.0',
      transport: McpTransportType.STDIO,
    }),
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
  providers: [AuthTool, GmailTool, GmailService],
})
export class AppModule {}