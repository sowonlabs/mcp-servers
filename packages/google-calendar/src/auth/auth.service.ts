import { Injectable, Logger } from '@nestjs/common';
import { authenticate } from '@google-cloud/local-auth';
import { TokenRepository } from './token.repository';
import { google, calendar_v3 } from 'googleapis';
import * as path from 'path';
import * as fs from 'fs';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(private readonly tokenRepository: TokenRepository) {
  }

  /**
   * 자격 증명 파일 경로를 가져옵니다.
   * 환경 변수에서 경로를 확인하거나 기본 경로를 사용합니다.
   * @param credentialsFilename 자격 증명 파일 이름 (기본값: credentials.json)
   * @returns 자격 증명 파일의 전체 경로
   */
  getCredentialsPath(credentialsFilename: string = 'credentials.json'): string {
    // 기본 경로 설정
    let credentialsPath = path.join(process.cwd(), credentialsFilename);
    
    // 환경 변수에 설정된 경로가 있으면 사용
    if (process.env.GOOGLE_CREDENTIALS_PATH) {
      credentialsPath = process.env.GOOGLE_CREDENTIALS_PATH;
    }
    
    this.logger.debug(`자격 증명 파일 경로: ${credentialsPath}`);
    
    // 파일 존재 여부 확인
    if (!fs.existsSync(credentialsPath)) {
      const error = new Error(`자격 증명 파일을 찾을 수 없습니다: ${credentialsPath}`);
      this.logger.error(error.message);
      this.logger.error('Google Cloud Console에서 OAuth 2.0 자격 증명을 생성하고 credentials.json 파일을 다운로드하세요.');
      throw error;
    }
    
    return credentialsPath;
  }

  async authenticate(scopes: string[], credentialsFilename: string = 'credentials.json') {
    try {
      // 자격 증명 파일 경로 가져오기
      const credentials = this.getCredentialsPath(credentialsFilename);
      
      const auth = await authenticate({
        keyfilePath: credentials,
        scopes: scopes,
      });
      
      // 토큰 저장
      await this.tokenRepository.saveToken(auth.credentials);
      this.logger.log('인증이 성공적으로 완료되었습니다.');
      return auth;
    } catch (error) {
      this.logger.error('인증 중 오류가 발생했습니다:', error);
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

  async getCalendarClient(): Promise<calendar_v3.Calendar> {
    // 인증 상태 확인
    const isAuthenticated = await this.isAuthenticated();
    if (!isAuthenticated) {
      throw new Error('사용자가 인증되지 않았습니다. authenticate 도구를 먼저 실행하세요.');
    }
    
    // 토큰 로드
    const token = await this.tokenRepository.loadToken();
    
    // 자격 증명 파일 경로 가져오기
    const credentialsPath = this.getCredentialsPath();
    
    // credentials.json 파일 읽기
    const credentials = JSON.parse(fs.readFileSync(credentialsPath, 'utf-8'));
    const { client_id, client_secret, redirect_uris } = credentials.installed || credentials.web;
    
    // OAuth2 클라이언트 생성
    const oauth2Client = new google.auth.OAuth2(
      client_id,
      client_secret,
      redirect_uris[0]
    );
    
    // 저장된 토큰 설정
    oauth2Client.setCredentials(token);
    
    // 캘린더 클라이언트 생성 및 반환
    return google.calendar({ version: 'v3', auth: oauth2Client });
  }
}