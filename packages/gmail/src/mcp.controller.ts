import { Controller, Post, Get, Body, HttpCode, UseFilters, Req, Res, Logger } from '@nestjs/common';
import { McpHandler, JsonRpcRequest, JsonRpcExceptionFilter } from '@sowonai/nestjs-mcp-adapter';
import { Request, Response } from 'express';
import { SERVER_NAME } from './constants';

@Controller('mcp')
@UseFilters(JsonRpcExceptionFilter)
export class McpController {
  private readonly logger = new Logger('McpController');
  constructor(
      private readonly mcpHandler: McpHandler
  ) {}

  @Post()
  @HttpCode(202)
  async handlePost(@Req() req: Request, @Res() res: Response, @Body() body: any) {

    this.logger.debug(`request body: ${JSON.stringify(body)}`);
    const result = await this.mcpHandler.handleRequest(SERVER_NAME, req, res, body);

    // Notification 요청이거나 응답이 null이면 빈 응답
    if (result === null) {
      return res.end();
    }

    this.logger.debug(`response body: ${JSON.stringify(result)}`);

    // 일반 요청에 대한 응답
    return res.json(result);
  }

}
