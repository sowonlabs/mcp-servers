# @sowonai/hello-mcp

A Model Context Protocol (MCP) server that provides greeting functionality.

## MCP usage
### Claude desktop config (claude_desktop_config.json)
```
{
  "mcpServers": {
    "@sowonai/hello-mcp": {
      "command": "npx",
      "args": ["-y", "@sowonai/hello-mcp"]
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
npx @sowonai/hello-mcp
```

## Test usage (using jsonrpc)

### call tools
```json
{"jsonrpc":"2.0","id":"1","method":"tools/call","params":{"name":"hello-world","arguments":{"name":"Doha Park"}}}
```

### list resources
```json
{"jsonrpc":"2.0","id":"2","method":"resources/list","params":{}}
```

### read resource
```json
{"jsonrpc":"2.0","id":"3","method":"resources/read","params":{"uri":"mcp://hello-world/Doha Park"}}
```
