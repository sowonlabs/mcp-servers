import { Injectable, Logger } from '@nestjs/common';
import { GoogleOAuthService } from '@sowonai/nestjs-google-oauth-integration';
import { StderrLogger } from './stderr.logger';

@Injectable()
export class InstallService {
  private readonly logger: StderrLogger;

  constructor(
    private readonly googleOAuthService: GoogleOAuthService,
  ) {
    this.logger = new StderrLogger(InstallService.name, { timestamp: true });
  }

  async runInstallScript(serverName: string, packageName: string, command: string = "npx"): Promise<void> {
    this.logger.log(`Starting installation script for ${serverName}...`);
    try {
      const authInfo = await this.googleOAuthService.getOAuthInformationForMcp();
      const { clientId, clientSecret, refreshToken } = authInfo;

      if (!clientId || !clientSecret) {
        const errorMessage = `Could not retrieve client_id or client_secret for ${serverName}.`;
        this.logger.error(errorMessage);
        throw new Error(errorMessage);
      }

      if (!refreshToken) {
        const message = `
**************************************************************************************
Refresh token not found for ${serverName}.
A refresh token is typically issued only on the FIRST authorization for an application.
If you have previously authorized this application, a new refresh token might not be issued.
To obtain a new refresh token, you may need to:
1. Remove the application from your Google account's third-party app connections:
   https://myaccount.google.com/connections
2. Then, try running this authentication command again for ${serverName}.
**************************************************************************************
        `;
        console.log(message);
        return;
      }

      console.log(JSON.stringify(
        this.generateMcpConfig(serverName, packageName, command, clientId, clientSecret, refreshToken),
        null,
        2
      ));

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`Installation script failed for ${serverName}: ${errorMessage}`);
      throw error;
    }
  }

  private generateMcpConfig(serverName: string, packageName: string, command: string, clientId: string, clientSecret: string, refreshToken: string) {
    return {
      mcpServers: {
        [serverName]: {
          command: command,
          args: [packageName],
          env: {
            GOOGLE_CLIENT_ID: clientId,
            GOOGLE_CLIENT_SECRET: clientSecret,
            GOOGLE_REFRESH_TOKEN: refreshToken,
          },
        },
      },
    };
  }
}
