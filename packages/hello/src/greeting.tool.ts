import { Injectable } from '@nestjs/common';
import { Tool, Resource, Context } from '@rekog/mcp-nest';
import { z } from 'zod';

@Injectable()
export class GreetingTool {
  constructor() {}

  @Tool({
    name: 'hello-world',
    description:
      'Returns a greeting and simulates a long operation with progress updates',
    parameters: z.object({
      name: z.string().default('World'),
    }),
  })
  async sayHello({ name }: { name: string }, context: Context) {
    const greeting = `Hello, ${name}!`;
    return {
      content: [{ type: 'text', text: greeting }],
    };
  }

  @Resource({
    uri: 'mcp://hello-world/{userName}',
    name: 'Hello World',
    description: 'A simple greeting resource',
    mimeType: 'text/plain',
  })
  // Different from the SDK, we put the parameters and URI in the same object.
  async getCurrentSchema({ uri, userName }: { uri: string, userName: string }) {
    return {
      contents: [
        {
          uri,
          text: `User is ${userName}`,
          mimeType: 'text/plain',
        },
      ],
    };
  }
}