import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { TokenRepository } from './token.repository';
import { AuthGuard } from './auth.guard';

@Module({
  providers: [
    TokenRepository,
    AuthService,
    AuthGuard,
  ],
  exports: [TokenRepository, AuthService, AuthGuard],
})
export class AuthModule {}