# @sowonai/mcp-gmail

A Model Context Protocol (MCP) server for Gmail integration.

[![X](https://img.shields.io/badge/X-000000?style=for-the-badge&logo=x&logoColor=white)](https://x.com/dohapark81)
[![Threads](https://img.shields.io/badge/Threads-000000?style=for-the-badge&logo=threads&logoColor=white)](https://www.threads.com/@sowonlabs)

## What is MCP?

MCP (Model Context Protocol) is an open protocol that allows AI assistants, such as Claude Desktop, to interact with external services and tools through a standardized interface. By running this server, you can connect Gmail to Claude Desktop and manage your emails using natural language commands.

## Features

- List messages (gmail_listMessages)
- Read message details (gmail_readMessage)
- Send messages (gmail_sendMessage)
- Search messages (gmail_searchMessages)
- Check authentication status (gmail_checkAuthStatus)

## Installation and Configuration

To use this MCP server, you first need to generate a configuration snippet that you can add to your AI assistant's (e.g., Claude Desktop) settings. This process involves an initial authentication step to grant the necessary permissions.

1.  **Obtain Credentials**: Follow the steps in the "Creating a Google Cloud Project and Obtaining Credentials" section below to get your `credentials.json` file.
2.  **Run the Install Script**: Execute the following command in your terminal, replacing `/path/to/credentials.json` with the actual path to your downloaded credentials file:

```bash
npx @sowonai/mcp-gmail --install --credentials /path/to/credentials.json
```

## MCP usage
### Claude desktop config (claude_desktop_config.json)
The configuration generated by the `--install` script should be used here. A typical structure looks like this:

```json
{
  "mcpServers": {
    "Gmail": {
      "command": "npx",
      "args": ["-y", "@sowonai/mcp-gmail"],
      "env": {
        "GOOGLE_CLIENT_ID": "YOUR_CLIENT_ID.apps.googleusercontent.com",
        "GOOGLE_CLIENT_SECRET": "YOUR_CLIENT_SECRET",
        "GOOGLE_REFRESH_TOKEN": "YOUR_REFRESH_TOKEN_FROM_INSTALL_STEP"
      }
    }
  }
}
```
Ensure the `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, and `GOOGLE_REFRESH_TOKEN` in the `env` section are correctly populated from the output of the `--install` command.

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
      "args": ["-y", "@sowonai/mcp-gmail"],
      "env": {
        "GOOGLE_CLIENT_ID": "YOUR_CLIENT_ID.apps.googleusercontent.com",
        "GOOGLE_CLIENT_SECRET": "YOUR_CLIENT_SECRET",
        "GOOGLE_REFRESH_TOKEN": "YOUR_REFRESH_TOKEN_FROM_INSTALL_STEP"
      }
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
10. Rename the downloaded file to `credentials.json`. You will need to provide the path to this file when running the `--install` command.

> **Warning:**  
> Never commit your `credentials.json` to a public repository. This file contains sensitive client secret information. The refresh token obtained during the `--install` process should also be kept secure.
