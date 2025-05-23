import { Injectable, Logger } from '@nestjs/common';
import { google, calendar_v3 } from 'googleapis';
import { GoogleOAuthService } from '@sowonai/nestjs-google-oauth-integration';

@Injectable()
export class CalendarService {
  private readonly logger = new Logger(CalendarService.name);
  
  constructor(
    private readonly authService: GoogleOAuthService,
  ) {}

  async getCalendarClient(): Promise<calendar_v3.Calendar> {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;

    if (!clientId || !clientSecret || !refreshToken) {
      throw new Error('Missing environment variables: GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REFRESH_TOKEN');
    }

    // Create OAuth2 client
    const oauth2Client = new google.auth.OAuth2(
        clientId,
        clientSecret,
    );

    // Set saved token
    oauth2Client.setCredentials({
      refresh_token: refreshToken
    });

    // Create and return calendar client
    return google.calendar({ version: 'v3', auth: oauth2Client });
  }
}
