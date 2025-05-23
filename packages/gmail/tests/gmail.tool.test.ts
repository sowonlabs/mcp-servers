import { INestApplicationContext } from '@nestjs/common';
import { AppModule } from '../src/app.module';
import { Test, TestingModule } from '@nestjs/testing';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { GmailTool } from "../src/gmail.tool";
import { CliOptions } from "../src/cli-options";

const args: CliOptions = {
  protocol: 'STDIO',
  credentials: 'credentials.json',
};

describe('GmailTool Test', () => {
  let app: INestApplicationContext;
  let gmailTool: GmailTool;

  beforeAll(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [AppModule.forRoot(args)],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();

    gmailTool = app.get<GmailTool>(GmailTool);
  });

  afterAll(async () => {
    await app.close();
    console.log('Application context closed.');
  });

  it('listMessages test', async () => {
    const result = await gmailTool.listMessages({maxResults: 5});
    console.log('Result:', result);
  }, 60_000);
  
});

