import { CanActivate, ExecutionContext, Injectable, Logger } from '@nestjs/common';
import { AuthService } from './auth.service';

@Injectable()
export class AuthGuard implements CanActivate {
  private readonly logger = new Logger(AuthGuard.name);

  constructor(private readonly authService: AuthService) {
    this.logger.log('AuthGuard 인스턴스 생성', authService);
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    this.logger.log('AuthGuard canActivate 메서드 실행');
    return this.authService.isAuthenticated();
  }
}