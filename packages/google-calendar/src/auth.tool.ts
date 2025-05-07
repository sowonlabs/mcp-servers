import { Injectable, Inject, Logger } from '@nestjs/common';
import { Tool, Resource, Context } from '@rekog/mcp-nest';
import { z } from 'zod';
import { AuthService } from './auth/auth.service';

@Injectable()
export class AuthTool {
  private readonly logger = new Logger(AuthTool.name);
  
  constructor(private readonly authService: AuthService) {
  }

  @Tool({
    name: 'authenticate',
    description:
      'A tool for Google authentication. This tool authenticates users using Google authentication.',
  })
  async authenticate(context: Context) {
    this.logger.log('Starting Google authentication process');
    const SCOPES = [
      'https://www.googleapis.com/auth/calendar',
      'https://www.googleapis.com/auth/calendar.events',
    ];

    await this.authService.authenticate(SCOPES);
    this.logger.log('Google authentication completed successfully');

    return {
      content: [{ type: 'text', text: 'Authentication completed successfully.' }],
    };
  }

  @Tool({
    name: 'checkAuthStatus',
    description: 'Check the current Google authentication status of the user.',
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