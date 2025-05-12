import { Module } from '@nestjs/common';
import { McpModule, McpTransportType } from '@rekog/mcp-nest';
import { AuthTool } from './auth.tool';
import { AuthModule } from './auth/auth.module';
import { GmailTool } from './gmail.tool';

@Module({
  imports: [
    AuthModule,
    McpModule.forRoot({
      name: 'gmail',
      version: '0.1.0',
      transport: McpTransportType.STDIO,
    }),
  ],
  providers: [AuthTool, GmailTool],
})
export class AppModule {}