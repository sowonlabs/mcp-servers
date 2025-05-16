import { Injectable, Inject, Logger } from '@nestjs/common';
import { google, gmail_v1 } from 'googleapis';
import { GoogleOAuthService, TokenRepository } from '@sowonai/nestjs-google-oauth-integration';
import * as fs from 'fs';

@Injectable()
export class GmailService {
  private readonly logger = new Logger(GmailService.name);
  
  constructor(
    private readonly authService: GoogleOAuthService,
    @Inject('TOKEN_REPOSITORY') private readonly tokenRepository: TokenRepository,
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
}
