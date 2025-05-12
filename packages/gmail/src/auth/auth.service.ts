import { Injectable, Logger } from '@nestjs/common';
import { authenticate } from '@google-cloud/local-auth';
import { TokenRepository } from './token.repository';
import { google, gmail_v1 } from 'googleapis';
import * as path from 'path';
import * as fs from 'fs';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(private readonly tokenRepository: TokenRepository) {
  }

  /**
   * Get the credentials file path.
   * Checks the environment variable or uses the default path.
   * @param credentialsFilename Name of the credentials file (default: credentials.json)
   * @returns Full path to the credentials file
   */
  getCredentialsPath(credentialsFilename: string = 'credentials.json'): string {
    // Set default path
    let credentialsPath = path.join(process.cwd(), credentialsFilename);

    // Use path from environment variable if set
    if (process.env.GOOGLE_CREDENTIALS_PATH) {
      credentialsPath = process.env.GOOGLE_CREDENTIALS_PATH;
    }

    this.logger.debug(`Credentials file path: ${credentialsPath}`);

    // Check if file exists
    if (!fs.existsSync(credentialsPath)) {
      const error = new Error(`Credentials file not found: ${credentialsPath}`);
      this.logger.error(error.message);
      this.logger.error('Please create OAuth 2.0 credentials in Google Cloud Console and download the credentials.json file.');
      throw error;
    }

    return credentialsPath;
  }

  async authenticate(scopes: string[], credentialsFilename: string = 'credentials.json') {
    try {
      // Get credentials file path
      const credentials = this.getCredentialsPath(credentialsFilename);

      const auth = await authenticate({
        keyfilePath: credentials,
        scopes: scopes,
      });

      // Save token
      await this.tokenRepository.saveToken(auth.credentials);
      this.logger.log('Authentication completed successfully.');
      return auth;
    } catch (error) {
      this.logger.error('An error occurred during authentication:', error);
      throw error;
    }
  }

  async loadSavedCredentialsIfExist() {
    return this.tokenRepository.loadToken();
  }

  async isAuthenticated(): Promise<boolean> {
    const token = await this.tokenRepository.loadToken();
    if (!token) {
      return false;
    }

    // Check token expiration time
    if (token.expiry_date) {
      this.logger.debug(`Token expiration time: ${new Date(token.expiry_date)}`);

      const currentTime = new Date().getTime();
      if (currentTime >= token.expiry_date) {
        this.logger.debug('Token has expired. Re-authentication required.');
        return false;
      }
    }

    return true;
  }

  async getGmailClient(): Promise<gmail_v1.Gmail> {
    // Check authentication status
    const isAuthenticated = await this.isAuthenticated();
    if (!isAuthenticated) {
      throw new Error('User is not authenticated. Please run the authenticate tool first.');
    }

    // Load token
    const token = await this.tokenRepository.loadToken();

    // Get credentials file path
    const credentialsPath = this.getCredentialsPath();

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

    // Create and return gmail client
    return google.gmail({ version: 'v1', auth: oauth2Client });
  }
}