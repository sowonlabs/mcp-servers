# @sowonai/mcp-google-calendar

## dev usage
```shell
npm run dev
```

## npx usage
```shell
npx @sowonai/mcp-google-calendar
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