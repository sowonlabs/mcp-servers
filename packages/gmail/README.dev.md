# @sowonai/mcp-gmail

## Development Environment Usage
```shell
npm run dev
```

## npx Usage
```shell
npx @sowonai/mcp-gmail
```

## Test Usage (using jsonrpc)

### Tool Calls
```json
{"jsonrpc":"2.0","id":"1","method":"tools/call","params":{"name":"hello","arguments":{}}}
```

```json
{"jsonrpc":"2.0","id":"1","method":"tools/call","params":{"name":"gmail_checkAuthStatus","arguments":{}}}
```

```json
{"jsonrpc":"2.0","id":"1","method":"tools/call","params":{"name":"gmail_listMessages","arguments":{"maxResults": 5}}}
```

```json
{"jsonrpc":"2.0","id":"1","method":"tools/call","params":{"name":"gmail_searchMessages","arguments":{"query": "is:unread", "maxResults": 5}}}
```

```json
{"jsonrpc":"2.0","id":"1","method":"tools/call","params":{"name":"gmail_readMessage","arguments":{"messageId": "MESSAGE_ID_HERE"}}}
```

```json
{"jsonrpc":"2.0","id":"1","method":"tools/call","params":{"name":"gmail_sendMessage","arguments":{
  "to": "recipient@example.com",
  "subject": "Hello",
  "body": "This is a test email sent through MCP.",
  "cc": "cc@example.com",
  "bcc": "bcc@example.com"
}}}
```
