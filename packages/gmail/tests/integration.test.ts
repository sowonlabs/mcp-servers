import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import path from 'path';
import { execSync } from 'child_process';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import {
  CallToolRequest,
  CallToolResultSchema,
} from '@modelcontextprotocol/sdk/types.js';
import * as dotenv from 'dotenv';

const MINUTE = 60_000;

// Get current directory path
const __dirname = path.dirname(fileURLToPath(import.meta.url));

describe('MCP server integration test', () => {
  let client: Client;
  let transport: StdioClientTransport;
  
  beforeAll(async () => {
    console.log('Starting MCP server...');

    dotenv.config({ path: '../.env.test' });
    
    // Run NestJS build command
    try {
      console.log('Building NestJS project...');
      execSync('npm run build', {
        cwd: path.resolve(__dirname, '..'),
        stdio: 'inherit'
      });
    } catch (error) {
      console.error('Build failed:', error);
      throw error;
    }
    
    // Check built JavaScript file path
    const mainJsPath = path.resolve(__dirname, '../dist/main.js');
    
    if (!fs.existsSync(mainJsPath)) {
      throw new Error(`Built file not found: ${mainJsPath}`);
    }
    
    // Create MCP client
    client = new Client({
      name: 'test-client',
      version: '1.0.0',
    });
    
    // Create StdioClientTransport
    transport = new StdioClientTransport({
      command: 'node',
      args: [mainJsPath],
      cwd: path.resolve(__dirname, '..'),
      env: {
        GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
        GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
        GOOGLE_REFRESH_TOKEN: process.env.GOOGLE_REFRESH_TOKEN,
      }
    });
    
    // Connect client and transport
    console.log('Connecting to MCP server...');
    await client.connect(transport);
    
    console.log('MCP server is ready. Starting tests.');
  });
  
  afterAll(async () => {
    // Close connection after tests
    if (transport) {
      await transport.close();
      console.log('Closed MCP server connection.');
    }
  });

  it('listMessages tool test', async () => {
    const request: CallToolRequest = {
      method: 'tools/call',
      params: {
        name: 'gmail_listMessages',
        arguments: {}
      }
    };

    const response = await client.request(request, CallToolResultSchema);
    console.log('Response:', response);
  }, MINUTE);

});