import { DynamicModule, Module } from '@nestjs/common';
import { McpAdapterModule } from '@sowonai/nestjs-mcp-adapter';
import { GoogleOAuthModule } from '@sowonai/nestjs-google-oauth-integration';
import { DriveService } from './drive.service';
import { DriveTool } from './drive.tool';
import { parseCliOptions } from './cli-options';
import { McpController } from './mcp.controller';
import { CliOptions } from "./cli-options";
import { SERVER_NAME } from './constants';
import { StderrLogger } from './stderr.logger';
import { InstallService } from './install.service';

const DRIVE_SCOPES = [
  'https://www.googleapis.com/auth/drive',
  'https://www.googleapis.com/auth/drive.file',
  'https://www.googleapis.com/auth/drive.readonly',
  'https://www.googleapis.com/auth/drive.metadata.readonly'
];

// Set credentials file path as an environment variable
const args = parseCliOptions();

@Module({})
export class AppModule {
  static forRoot(args: CliOptions): DynamicModule {
    return {
      module: AppModule,
      imports: [
        McpAdapterModule.forRoot({
          servers: {
            [SERVER_NAME]: {
              version: '0.2.0',
              instructions: 'Google Drive integration server for MCP.',
            }
          }
        }),
        GoogleOAuthModule.forRoot({
          name: SERVER_NAME,
          credentialsFilename: args.credentials || 'credentials.json',
          scopes: DRIVE_SCOPES,
          logging: {
            enabled: args.log || false,
          }
        }),
      ],
      controllers: [McpController],
      providers: [
        DriveTool,
        DriveService,
        StderrLogger,
        InstallService,
      ],
      exports: [DriveService],
    };
  }
}
