import { Module } from '@nestjs/common';
import { McpModule, McpTransportType } from '@rekog/mcp-nest';
import { AuthTool } from './auth.tool';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [
    AuthModule,
    McpModule.forRoot({
      name: 'google-calendar-mcp',
      version: '0.1.0',
      transport: McpTransportType.STDIO,
    }),
  ],
  providers: [AuthTool],
})
export class AppModule {}