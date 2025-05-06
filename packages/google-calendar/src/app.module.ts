import { Module } from '@nestjs/common';
import { McpModule, McpTransportType } from '@rekog/mcp-nest';
import { GreetingTool } from './greeting.tool';

@Module({
  imports: [
    McpModule.forRoot({
      name: 'google-calendar-mcp',
      version: '0.1.0',
      transport: McpTransportType.STDIO,
    }),
  ],
  providers: [GreetingTool],
})
export class AppModule {}