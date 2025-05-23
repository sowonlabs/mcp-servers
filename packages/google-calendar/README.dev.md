# @sowonai/mcp-google-calendar

## Development Environment Usage
```shell
npm run dev
```

{"jsonrpc": "2.0","id": "1","method": "initialize","params": {"protocolVersion": "2025-03-26","capabilities": {},"clientInfo": {"name": "test","version": "0.1.0"}}}
{"jsonrpc": "2.0","method": "notifications/initialized"}
{"jsonrpc":"2.0","id":"2","method":"ping"}
{"jsonrpc":"2.0","id":"3","method":"tools/list"}



## npx Usage
```shell
npx @sowonai/mcp-google-calendar
```

## Test Usage (using jsonrpc)

### Tool Calls
```json
{"jsonrpc":"2.0","id":"1","method":"tools/call","params":{"name":"gcalendar_authenticate","arguments":{}}}
```

```json
{"jsonrpc":"2.0","id":"1","method":"tools/call","params":{"name":"gcalendar_checkAuthStatus","arguments":{}}}
```

```json
{"jsonrpc":"2.0","id":"1","method":"tools/call","params":{"name":"gcalendar_listCalendars","arguments":{}}}
```

```json
{"jsonrpc":"2.0","id":"1","method":"tools/call","params":{"name":"gcalendar_listEvents","arguments":{"calendarId": "primary"}}}
```

```json
{"jsonrpc":"2.0","id":"1","method":"tools/call","params":{"name":"gcalendar_createEvent","arguments":{
  "calendarId": "primary",
  "summary": "회의",
  "location": "회의실 A",
  "description": "프로젝트 진행 상황 논의",
  "start": {
    "dateTime": "2025-05-10T13:00:00+09:00",
    "timeZone": "Asia/Seoul"
  },
  "end": {
    "dateTime": "2025-05-10T14:00:00+09:00",
    "timeZone": "Asia/Seoul"
  },
  "attendees": [
    {
      "email": "colleague@example.com",
      "displayName": "동료"
    }
  ],
  "reminders": {
    "useDefault": false,
    "overrides": [
      {
        "method": "popup",
        "minutes": 30
      }
    ]
  }
}}}
```
