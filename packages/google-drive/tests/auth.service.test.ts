import { INestApplicationContext } from '@nestjs/common';
import { AuthService } from '../src/auth/auth.service';
import { TokenRepository } from '../src/auth/token.repository';
import { AppModule } from '../src/app.module';
import { Test, TestingModule } from '@nestjs/testing';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';

describe('AuthService Integration Test (Full Application)', () => {
  let appContext: INestApplicationContext;
  let authService: AuthService;
  let tokenRepository: TokenRepository;
  
  // Load the entire app module before all tests
  beforeAll(async () => {
    // Create a test application context using the Test module
    // The NestJS test module is designed to ensure dependency injection works properly in the test environment
    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    appContext = moduleRef.createNestApplication();
    await appContext.init();
    
    authService = moduleRef.get<AuthService>(AuthService);
    tokenRepository = moduleRef.get<TokenRepository>(TokenRepository);
    
    console.log('Successfully initialized the full application context.');
    console.log(`TokenRepository injection status: ${tokenRepository ? 'Success' : 'Failure'}`);
    console.log(`AuthService injection status: ${authService ? 'Success' : 'Failure'}`);
  });

  // Close the ApplicationContext after all tests
  afterAll(async () => {
    await appContext.close();
    console.log('Application context closed.');
  });

  // Actual authentication test
  it('Google OAuth authentication and refresh token acquisition test', async () => {
    // This test actually starts the OAuth authentication process
    // The user must proceed with authentication in the browser
    const scopes = [
      'https://www.googleapis.com/auth/drive',
      'https://www.googleapis.com/auth/drive.file',
      'https://www.googleapis.com/auth/drive.readonly',
      'https://www.googleapis.com/auth/drive.metadata.readonly'
    ];
    
    // This part actually starts the OAuth authentication process
    // A browser window will open and the user must log in with their Google account
    console.log('Starting OAuth authentication process. Please log in with your Google account in the browser window.');
    const auth = await authService.authenticate(scopes, '../credentials.json');
    
    // Check if authentication was completed successfully
    expect(auth).toBeDefined();
    expect(auth.credentials).toBeDefined();
    
    // Check if refresh_token was acquired
    // Note: If already authenticated, refresh_token may not be present
    console.log('Authentication result:', JSON.stringify(auth.credentials, null, 2));

    // Check if refresh_token exists
    // Only issued on first authentication
    if (auth.credentials.refresh_token) {
      console.log('Successfully acquired refresh_token!');
      expect(auth.credentials.refresh_token).toBeDefined();
    } else {
      console.log('No refresh_token found. Revoke app permissions in your Google account and try again.');
      console.log('https://myaccount.google.com/permissions');
    }
    
    // Check if the token was saved
    const savedToken = await tokenRepository.loadToken();
    expect(savedToken).toBeDefined();
  }, 60_000);
  
  it('Should be able to check authentication status', async () => {
    const isAuthenticated = await authService.isAuthenticated();
    console.log('Current authentication status:', isAuthenticated);
    // Here, we verify that the authentication status is either true or false
    expect(typeof isAuthenticated).toBe('boolean');
  });
});
