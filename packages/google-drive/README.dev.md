# Google Drive MCP Server Development Notes

This document contains notes and instructions for developing the Google Drive MCP server.

## Development Setup

1. Clone the repository
   ```bash
   git clone https://github.com/your-org/mcp-servers.git
   cd mcp-servers
   ```

2. Install dependencies
   ```bash
   npm install
   ```

3. Set up credentials
   - Create OAuth 2.0 credentials in the Google Cloud Console
   - Enable the Google Drive API
   - Download the credentials.json file and place it in the package directory

4. Run in development mode
   ```bash
   npm run dev -- --credentials=/path/to/credentials.json
   ```

## Building

```bash
npm run build
```

## Testing

```bash
npm test
```

## Architecture

### Main Components

1. **drive.tool.ts** - Contains the core functionality for interacting with Google Drive
2. **auth.tool.ts** - Handles user authentication with Google Drive API
3. **auth/auth.service.ts** - Service for managing authentication and token handling
4. **auth/token.repository.ts** - Repository for storing and retrieving authentication tokens
5. **main.ts** - Entry point, sets up NestJS and MCP server

### Authentication Flow

1. User calls `authenticate()` tool
2. System opens browser for OAuth consent
3. Token is saved to `~/.sowonai/google-drive-token.json`
4. Subsequent calls use saved token

### API Calls

The server uses the Google Drive v3 API. Most API calls are wrapped in try/catch blocks to provide friendly error messages.

## Adding New Features

To add a new tool:

1. Add the new method to the `DriveTool` class in `drive.tool.ts`
2. Decorate it with `@Tool` with appropriate parameters and description
3. Implement the logic using the Drive API
4. Add appropriate error handling

## Publishing

```bash
npm run prepack
npm publish
```
