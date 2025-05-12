import { Injectable, Logger } from '@nestjs/common';
import { Tool, Context } from '@rekog/mcp-nest';
import { z } from 'zod';
import { AuthService } from './auth/auth.service';
import { PREFIX_TOOL_NAME } from './constants';

@Injectable()
export class AuthTool {
  private readonly logger = new Logger(AuthTool.name);
  
  constructor(private readonly authService: AuthService) {
  }

  @Tool({
    name: `${PREFIX_TOOL_NAME}authenticate`,
    description:
      'A tool for Google Drive authentication. This tool authenticates users for Google Drive access.',
  })
  async authenticate(context: Context) {
    this.logger.log('Starting Google Drive authentication process');
    const SCOPES = [
      'https://www.googleapis.com/auth/drive',
      'https://www.googleapis.com/auth/drive.file',
      'https://www.googleapis.com/auth/drive.readonly',
      'https://www.googleapis.com/auth/drive.metadata.readonly'
    ];

    await this.authService.authenticate(SCOPES);
    this.logger.log('Google Drive authentication completed successfully');

    return {
      content: [{ type: 'text', text: 'Authentication completed successfully.' }],
    };
  }

  @Tool({
    name: `${PREFIX_TOOL_NAME}checkAuthStatus`,
    description: 'Check the current Google Drive authentication status.',
    parameters: z.object({}),
  })
  async checkAuthStatus(params: Record<string, never>, context: Context) {
    this.logger.log('Checking authentication status');
    const isAuthenticated = await this.authService.isAuthenticated();
    
    const statusMessage = isAuthenticated 
      ? 'User is currently authenticated.' 
      : 'User is not authenticated. Please run the authenticate tool first.';
    
    this.logger.log(`Authentication status: ${isAuthenticated ? 'Authenticated' : 'Not authenticated'}`);
    
    return {
      content: [{ type: 'text', text: statusMessage }],
      isAuthenticated
    };
  }
}
