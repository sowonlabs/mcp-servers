# @sowonai/mcp-google-calendar

A Model Context Protocol (MCP) server for Google Calendar integration.

## What is MCP?

MCP (Model Context Protocol) is an open protocol that allows AI assistants, such as Claude Desktop, to interact with external services and tools through a standardized interface. By running this server, you can connect your Google Calendar to Claude Desktop and manage your schedule using natural language commands.

## Features

- Authenticate (authenticate)
- Check authentication status (checkAuthStatus)
- List calendars (listCalendars)
- List events (listEvents)

## MCP usage
### Claude desktop config (claude_desktop_config.json)
```
{
  "mcpServers": {
    "@sowonai/google-calendar-mcp": {
      "command": "npx",
      "args": [
        "-y", 
        "@sowonai/google-calendar-mcp", 
        "--credentials", 
        "/path/to/credentials.json"
      ]
    }
  }
}
```

## Creating a Google Cloud Project and Obtaining Credentials

1. Go to the [Google Cloud Console](https://console.cloud.google.com/).
2. Create a new project or select an existing one.
3. Enable the **Google Calendar API** for your project:
   - Navigate to "APIs & Services" > "Library"
   - Search for "Google Calendar API" and enable it
4. Go to "APIs & Services" > "Credentials".
5. Click "Create Credentials" > "OAuth client ID".
6. Choose **Web application** as the application type.
7. Enter a name for your client.
8. If you select **Web application**, add the following to the list of authorized redirect URIs:
   ```
   http://localhost:4100/code
   ```
9. Click "Create" and download the OAuth client JSON file.
10. Rename the downloaded file to `credentials.json` and place it in your project root.

credentials.json file looks like:
```
{
  "web": {
    "client_id": "[YOUR_CLIENT_ID].apps.googleusercontent.com",
    "project_id": "[YOUR_PROJECT_ID]",
    "auth_uri": "https://accounts.google.com/o/oauth2/auth",
    "token_uri": "https://oauth2.googleapis.com/token",
    "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
    "client_secret": "[YOUR_CLIENT_SECRET]",
    "redirect_uris": [
      "http://localhost:4100/code"
    ]
  }
}
```

> **Warning:**  
> Never commit your `credentials.json` to a public repository. This file contains sensitive information.

## How to Authenticate

To authenticate, call the `authenticate` tool using a JSON-RPC request:

```json
{
  "jsonrpc": "2.0",
  "id": "1",
  "method": "tools/call",
  "params": {
    "name": "authenticate",
    "arguments": {}
  }
}
```

If you are using this server with Claude Desktop or another AI assistant, you can simply request authentication in natural language. The AI will automatically call the `authenticate` tool for you when needed.

This will start the authentication process and open a browser window for Google login. After successful authentication, your token will be saved automatically.

## Token Storage Location

When you authenticate, your Google Calendar access token is securely saved in your home directory under the following path:

```
~/.sowonai/google-calendar-token.json
```

This file is used to maintain your login session. Do not share or commit this file to any public repository.

