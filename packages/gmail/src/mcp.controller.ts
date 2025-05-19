import { Controller, Post, Get, Body, UseGuards, UseFilters } from '@nestjs/common';
import { McpToolHandler, JsonRpcRequest, JsonRpcExceptionFilter } from '@sowonai/nestjs-mcp-adapter';

@Controller('mcp')
@UseFilters(JsonRpcExceptionFilter)
export class McpController {
    constructor(
        private readonly mcpToolHandler: McpToolHandler
    ) {}

    @Post()
    async handlePost(@Body() body: JsonRpcRequest) {
        return this.mcpToolHandler.handlePost('mcp-gmail', body);
    }

    @Get()
    async handleGet() {
        return this.mcpToolHandler.handleGet('mcp-gmail');
    }
}
