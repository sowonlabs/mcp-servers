# @sowonai/hello-mcp

A Model Context Protocol (MCP) server that provides greeting functionality.

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

## Installation
```shell
npm install
```

## dev usage
```shell
npm run dev
```

## npx usage
```shell
npx @sowonai/google-calendar-mcp
```

## Test usage (using jsonrpc)

### call tools
```json
{"jsonrpc":"2.0","id":"1","method":"tools/call","params":{"name":"authenticate","arguments":{}}}
```

```json
{"jsonrpc":"2.0","id":"1","method":"tools/call","params":{"name":"checkAuthStatus","arguments":{}}}
```

```json
{"jsonrpc":"2.0","id":"1","method":"tools/call","params":{"name":"listCalendars","arguments":{}}}
```

```json
{"jsonrpc":"2.0","id":"1","method":"tools/call","params":{"name":"listEvents","arguments":{"calendarId": "primary"}}}
```
