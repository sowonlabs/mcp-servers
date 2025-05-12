# @sowonai/mcp-gmail

A Model Context Protocol (MCP) server for Gmail integration.

## What is MCP?

MCP (Model Context Protocol) is an open protocol that allows AI assistants, such as Claude Desktop, to interact with external services and tools through a standardized interface. By running this server, you can connect Gmail to Claude Desktop and manage your emails using natural language commands.

## Features

- Authentication (authenticate)
- Check authentication status (checkAuthStatus)
- List messages (listMessages)
- Read message details (readMessage)
- Send messages (sendMessage)
- Search messages (searchMessages)

## MCP usage
### Claude desktop config (claude_desktop_config.json)
```
{
  "mcpServers": {
    "@sowonai/mcp-gmail": {
      "command": "npx",
      "args": [
        "-y", 
        "@sowonai/mcp-gmail", 
        "--credentials", 
        "/path/to/credentials.json"
      ]
    }
  }
}
```

### SowonFlow Integration Example

You can utilize the Gmail MCP in a YAML-based workflow like this:

```javascript
const workflow = new Workflow({
  mainWorkflow: `
version: "agentflow/v1"
kind: "WorkflowSpec"
metadata:
  name: "Gmail Assistant"
  description: "Gmail MCP usage example"
  version: "0.1.0"

agents:
  - id: "gmail_agent"
    inline:
      type: "agent"
      model: "openai/gpt-4.1-mini"
      system_prompt: |
        You are a Gmail assistant that helps manage emails.
        Use MCP tools to answer user questions. (MCP tools have the prefix "mcp__")
        
        <information>
        Current time: '${new Date().toISOString()}'
        </information>

      mcp: ["mcp-gmail"]
        
nodes:
  start:
    type: "agent_task"
    agent: "gmail_agent"
    next: "end"
  
  end:
    type: "end"
`,
  mcpServers: {
    "mcp-gmail": {
      "command": "npx",
      "args": ["-y", "@sowonai/mcp-gmail", "--credentials", "/path/to/credentials.json"]
    }
  }
});

// Ask a question to the workflow
const result = await workflow.ask("Show me my recent emails");
console.log(result.content);
```

This example defines an agent in the workflow that can answer email-related questions using the Gmail MCP server. SowonFlow is an AI-based workflow engine that interprets and executes workflows defined in YAML.

### What is SowonFlow?
SowonFlow is a workflow product designed to conveniently utilize LLMs, featuring embedded workflows and lightweight workflows as its key characteristics. It can be used to create assistants available on Slack within the SowonAI service, and SowonFlow can also be embedded into your company's services. It can be utilized to create expert assistants that handle specific tasks on Slack.

## Creating a Google Cloud Project and Obtaining Credentials

1. Go to the [Google Cloud Console](https://console.cloud.google.com/).
2. Create a new project or select an existing one.
3. Enable the **Gmail API** for your project:
   - Navigate to "APIs & Services" > "Library"
   - Search for "Gmail API" and enable it
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

The credentials.json file looks like:
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

When you authenticate, your Gmail access token is securely saved in your home directory under the following path:

```
~/.sowonai/gmail-token.json
```

This file is used to maintain your login session. Do not share or commit this file to any public repository.