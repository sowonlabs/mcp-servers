import { Module } from '@nestjs/common';
import { McpModule, McpTransportType } from '@rekog/mcp-nest';
import { AuthTool } from './auth.tool';
import { AuthModule } from './auth/auth.module';
import { DriveTool } from './drive.tool';

@Module({
  imports: [
    AuthModule,
    McpModule.forRoot({
      name: 'google-drive',
      version: '0.1.0',
      transport: McpTransportType.STDIO,
    }),
  ],
  providers: [AuthTool, DriveTool],
})
export class AppModule {}
