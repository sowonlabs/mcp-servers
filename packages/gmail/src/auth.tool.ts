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
      'A tool for Gmail authentication. This tool authenticates users for Gmail access.',
  })
  async authenticate(context: Context) {
    this.logger.log('Starting Gmail authentication process');
    const SCOPES = [
      'https://www.googleapis.com/auth/gmail.readonly',
      'https://www.googleapis.com/auth/gmail.send',
      'https://www.googleapis.com/auth/gmail.compose',
      'https://www.googleapis.com/auth/gmail.modify',
    ];

    await this.authService.authenticate(SCOPES);
    this.logger.log('Gmail authentication completed successfully');

    return {
      content: [{ type: 'text', text: 'Gmail Authentication completed successfully.' }],
    };
  }

  @Tool({
    name: `${PREFIX_TOOL_NAME}checkAuthStatus`,
    description: 'Check the current Gmail authentication status.',
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