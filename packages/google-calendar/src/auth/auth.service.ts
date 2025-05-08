import { Injectable, Logger } from '@nestjs/common';
import { authenticate } from '@google-cloud/local-auth';
import { TokenRepository } from './token.repository';
import { google } from 'googleapis';
import * as path from 'path';
import * as fs from 'fs';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(private readonly tokenRepository: TokenRepository) {
  }

  async authenticate(scopes: string[], credentialsFilename: string = 'credentials.json') {
    // Check credentials file path from environment variables
    let credentials = path.join(process.cwd(), credentialsFilename);
    
    // Use the path set in environment variables if available
    if (process.env.GOOGLE_CREDENTIALS_PATH) {
      credentials = process.env.GOOGLE_CREDENTIALS_PATH;
    }
    
    this.logger.debug(`Credentials file path to be used: ${credentials}`);
    
    // Check if credentials.json file exists
    if (!fs.existsSync(credentials)) {
      const error = new Error(`Unable to find credentials.json file. The file should be at: ${credentials}`);
      this.logger.error(error.message);
      this.logger.error('Create OAuth 2.0 credentials in Google Cloud Console and download the credentials.json file.');
      throw error;
    }
    
    try {
      const auth = await authenticate({
        keyfilePath: credentials,
        scopes: scopes,
      });
      
      // Save token
      await this.tokenRepository.saveToken(auth.credentials);
      this.logger.log('Authentication completed successfully.');
      return auth;
    } catch (error) {
      this.logger.error('Error occurred during authentication:', error);
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
}