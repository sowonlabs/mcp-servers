import { Injectable, Inject, Logger } from '@nestjs/common';
import { google, gmail_v1 } from 'googleapis';
import { GoogleOAuthService, FileSystemTokenRepository, TokenRepository } from '@sowonai/nestjs-google-oauth-integration';
import { StderrLogger } from './stderr.logger';
import { InstallService } from './install.service';

@Injectable()
export class GmailService {
  private readonly logger = new StderrLogger(GmailService.name, { timestamp: true });
  
  constructor(
    private readonly authService: GoogleOAuthService, // GoogleOAuthService를 직접 주입받도록 유지
    private readonly installService: InstallService, // InstallService 주입
  ) {}

  async getGmailClient(): Promise<gmail_v1.Gmail> {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;

    if (!clientId || !clientSecret || !refreshToken) {
      throw new Error('Missing environment variables: GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REFRESH_TOKEN');
    }

    return this.getGmailClientByRefreshToken(clientId, clientSecret, refreshToken);
  }

  async getGmailClientByRefreshToken(clientId: string, clientSecret:string, refreshToken: string): Promise<gmail_v1.Gmail> {
    const oauth2Client = new google.auth.OAuth2(
        clientId,
        clientSecret
    );

    oauth2Client.setCredentials({
      refresh_token: refreshToken
    });

    return google.gmail({ version: 'v1', auth: oauth2Client });
  }

  /**
   * Run the installation script and print the configuration for MCP.
   */
  async runInstallScript(): Promise<void> {
    return this.installService.runInstallScript('mcp-gmail', '@sowonai/mcp-gmail');
  }
}
