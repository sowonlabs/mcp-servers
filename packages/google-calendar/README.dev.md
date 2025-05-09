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

```json
{"jsonrpc":"2.0","id":"1","method":"tools/call","params":{"name":"createEvent","arguments":{
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