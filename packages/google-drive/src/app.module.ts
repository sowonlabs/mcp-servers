import { Module } from '@nestjs/common';
import { McpModule, McpTransportType } from '@rekog/mcp-nest';
import { AuthTool } from './auth.tool';
import { GoogleOAuthModule, FileSystemTokenRepository } from '@sowonai/nestjs-google-oauth-integration';
import { DriveService } from './drive.service';
import { DriveTool } from './drive.tool';
import { parseCliOptions } from './cli-options';
import * as path from 'path';
import * as os from 'os';

// Set credentials file path as an environment variable
const args = parseCliOptions();

const tokenDir = path.join(os.homedir(), '.sowonai');

@Module({
  imports: [
    McpModule.forRoot({
      name: 'mcp-google-drive',
      version: '0.1.0',
      transport: McpTransportType.STDIO,
    }),
    GoogleOAuthModule.forRoot({
      name: 'mcp-google-drive',
      credentialsFilename: args.credentials || 'credentials.json',
      tokenRepository: new FileSystemTokenRepository({
        tokenDir: tokenDir,
        tokenPath: path.join(tokenDir, 'google-drive-token.json')
      }),
      scopes: [
        'https://www.googleapis.com/auth/drive',
        'https://www.googleapis.com/auth/drive.file',
        'https://www.googleapis.com/auth/drive.readonly',
        'https://www.googleapis.com/auth/drive.metadata.readonly'
      ],
      logging: {
        enabled: args.log
      }
    }),
  ],
  providers: [AuthTool, DriveTool, DriveService],
})
export class AppModule {}
