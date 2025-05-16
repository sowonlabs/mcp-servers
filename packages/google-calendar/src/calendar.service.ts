import { Injectable, Inject, Logger } from '@nestjs/common';
import { google, calendar_v3 } from 'googleapis';
import { GoogleOAuthService, TokenRepository } from '@sowonai/nestjs-google-oauth-integration';
import * as fs from 'fs';

@Injectable()
export class CalendarService {
  private readonly logger = new Logger(CalendarService.name);
  
  constructor(
    private readonly authService: GoogleOAuthService,
    @Inject('TOKEN_REPOSITORY') private readonly tokenRepository: TokenRepository,
  ) {}

  async getCalendarClient(): Promise<calendar_v3.Calendar> {
    // Check authentication status
    const isAuthenticated = await this.authService.isAuthenticated();
    if (!isAuthenticated) {
      throw new Error('User is not authenticated. Please run the authenticate tool first.');
    }

    const token = await this.tokenRepository.getToken();
    if (!token) {
      throw new Error('OAuth2 token not found. Please authenticate first.');
    }

    // Get credentials file path
    const credentialsPath = this.authService.getCredentialsPath();

    // Read credentials.json file
    const credentials = JSON.parse(fs.readFileSync(credentialsPath, 'utf-8'));
    const { client_id, client_secret, redirect_uris } = credentials.installed || credentials.web;

    // Create OAuth2 client
    const oauth2Client = new google.auth.OAuth2(
        client_id,
        client_secret,
        redirect_uris[0]
    );

    // Set saved token
    oauth2Client.setCredentials(token);

    // Create and return calendar client
    return google.calendar({ version: 'v3', auth: oauth2Client });
  }
}
