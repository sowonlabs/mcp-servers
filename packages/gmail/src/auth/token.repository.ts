import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

@Injectable()
export class TokenRepository {
  private readonly logger = new Logger(TokenRepository.name);
  private readonly tokenDir: string;
  private readonly tokenPath: string;

  constructor() {
    this.tokenDir = path.join(os.homedir(), '.sowonai');
    this.tokenPath = path.join(this.tokenDir, 'gmail-token.json');
    this.ensureTokenDirExists();
  }

  private ensureTokenDirExists(): void {
    if (!fs.existsSync(this.tokenDir)) {
      fs.mkdirSync(this.tokenDir, { recursive: true });
      this.logger.debug(`Created token directory at ${this.tokenDir}`);
    }
  }

  async saveToken(token: any): Promise<void> {
    fs.writeFileSync(this.tokenPath, JSON.stringify(token));
    this.logger.log(`Token saved to ${this.tokenPath}`);
  }

  async loadToken(): Promise<any | null> {
    try {
      if (fs.existsSync(this.tokenPath)) {
        const token = JSON.parse(fs.readFileSync(this.tokenPath, 'utf-8'));
        this.logger.debug('Token loaded successfully');
        return token;
      }
      this.logger.debug('No token file found');
      return null;
    } catch (error) {
      this.logger.error('Error occurred while loading token:', error);
      return null;
    }
  }
}