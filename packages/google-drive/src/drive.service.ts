import { Injectable, Logger } from '@nestjs/common';
import { google, drive_v3 } from 'googleapis';
import { GoogleOAuthService } from '@sowonai/nestjs-google-oauth-integration';

@Injectable()
export class DriveService {
  private readonly logger = new Logger(DriveService.name);
  
  constructor(
    private readonly authService: GoogleOAuthService,
  ) {}

  async getDriveClient(): Promise<drive_v3.Drive> {
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

    // Create and return drive client
    return google.drive({ version: 'v3', auth: oauth2Client });
  }
}
