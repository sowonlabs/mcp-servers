import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { TokenRepository } from './token.repository';

@Module({
  providers: [
    TokenRepository,
    AuthService,
  ],
  exports: [TokenRepository, AuthService],
})
export class AuthModule {}
