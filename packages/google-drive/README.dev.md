# @sowonai/mcp-google-drive

## Development Environment Usage
```shell
npm run dev
```

## npx Usage
```shell
npx @sowonai/mcp-google-drive
```

## Test Usage (using jsonrpc)

### Tool Calls
```json
{"jsonrpc":"2.0","id":"1","method":"tools/call","params":{"name":"gdrive_authenticate","arguments":{}}}
```

```json
{"jsonrpc":"2.0","id":"1","method":"tools/call","params":{"name":"gdrive_checkAuthStatus","arguments":{}}}
```

```json
{"jsonrpc":"2.0","id":"1","method":"tools/call","params":{"name":"gdrive_listFiles","arguments":{"maxResults": 10}}}
```

```json
{"jsonrpc":"2.0","id":"1","method":"tools/call","params":{"name":"gdrive_searchFiles","arguments":{"query": "mimeType='application/pdf'", "maxResults": 5}}}
```

```json
{"jsonrpc":"2.0","id":"1","method":"tools/call","params":{"name":"gdrive_getFileInfo","arguments":{"fileId": "FILE_ID_HERE"}}}
```

```json
{"jsonrpc":"2.0","id":"1","method":"tools/call","params":{"name":"gdrive_downloadFile","arguments":{"fileId": "FILE_ID_HERE", "destination": "/path/to/save/file.pdf"}}}
```

```json
{"jsonrpc":"2.0","id":"1","method":"tools/call","params":{"name":"gdrive_uploadFile","arguments":{"name": "my-document.txt", "content": "This is the content of my file.", "mimeType": "text/plain", "parents": ["FOLDER_ID_HERE"]}}}
```
