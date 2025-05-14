import { Injectable, Logger } from '@nestjs/common';
import { Tool, Context } from '@rekog/mcp-nest';
import { z } from 'zod';
import { GmailService } from './gmail.service';
import { PREFIX_TOOL_NAME } from './constants';

@Injectable()
export class GmailTool {
  private readonly logger = new Logger(GmailTool.name);
  
  constructor(
    private readonly gmailService: GmailService,
  ) {}

  @Tool({
    name: `${PREFIX_TOOL_NAME}listMessages`,
    description: 'Search and retrieve Gmail messages for the user. By default, returns the 10 most recent emails.',
    parameters: z.object({
      maxResults: z.number().describe('Maximum number of results (default: 10)').default(10),
      query: z.string().describe('Gmail search query (e.g., "from:example@gmail.com", "is:unread", "subject:hello")').optional(),
    }),
  })
  async listMessages(params: { 
    maxResults: number;
    query?: string;
  }, context: Context) {
    this.logger.log('Starting to retrieve message list');
    this.logger.log(`Maximum results: ${params.maxResults}`);
    if (params.query) {
      this.logger.log(`Search query: ${params.query}`);
    }
    
    try {
      // Get Gmail client
      const gmail = await this.gmailService.getGmailClient();
      
      // Create message list request
      const listRequest: any = {
        userId: 'me',
        maxResults: params.maxResults,
      };
      
      // Add search query if provided
      if (params.query) {
        listRequest.q = params.query;
      }
      
      // Retrieve message ID list
      const messageIdsResponse = await gmail.users.messages.list(listRequest);
      
      if (!messageIdsResponse.data.messages || messageIdsResponse.data.messages.length === 0) {
        return {
          content: [{ 
            type: 'text', 
            text: 'No search results found.' 
          }],
          messages: []
        };
      }
      
      this.logger.log(`Retrieved ${messageIdsResponse.data.messages.length} message IDs.`);
      
      // Retrieve details for each message
      const messagePromises = messageIdsResponse.data.messages.map(async (message) => {
        const messageResponse = await gmail.users.messages.get({
          userId: 'me',
          id: message.id as string,
          format: 'metadata',
          metadataHeaders: ['From', 'Subject', 'Date']
        });
        return messageResponse.data;
      });
      
      const messages = await Promise.all(messagePromises);
      this.logger.log(`Retrieved detailed information for ${messages.length} messages.`);
      
      // Process message data
      const formattedMessages = messages.map(message => {
        // Extract header data
        const headers = message.payload?.headers || [];
        const fromHeader = headers.find(h => h.name === 'From');
        const subjectHeader = headers.find(h => h.name === 'Subject');
        const dateHeader = headers.find(h => h.name === 'Date');
        
        const from = fromHeader?.value || 'No sender information';
        const subject = subjectHeader?.value || 'No subject';
        const date = dateHeader?.value ? new Date(dateHeader.value).toLocaleString('en-US') : 'No date information';
        
        // Process label information
        const isUnread = message.labelIds?.includes('UNREAD') || false;
        const isInbox = message.labelIds?.includes('INBOX') || false;
        const isImportant = message.labelIds?.includes('IMPORTANT') || false;
        
        return {
          id: message.id,
          threadId: message.threadId,
          from,
          subject,
          date,
          snippet: message.snippet || '',
          isUnread,
          isInbox,
          isImportant,
          labelIds: message.labelIds || []
        };
      });
      
      // Create response message
      const formattedList = formattedMessages.map((msg, idx) => {
        return `${idx + 1}. ${msg.isUnread ? '📮 [UNREAD]' : '📭'} ${msg.subject}\n` +
               `   From: ${msg.from}\n` +
               `   Date: ${msg.date}\n` +
               `   ID: ${msg.id}\n` +
               `   Content: ${msg.snippet}...\n`;
      }).join('\n');
      
      const responseText = `Found ${formattedMessages.length} emails.\n\n${formattedList}`;
      
      return {
        content: [
          { 
            type: 'text', 
            text: responseText
          }
        ],
        messages: formattedMessages
      };
    } catch (error: any) {
      this.logger.error('Error retrieving message list:', error);
      const errorMessage = error.message || 'An unknown error occurred';
      
      return {
        content: [
          { 
            type: 'text', 
            text: `Error retrieving message list: ${errorMessage}`
          }
        ],
        error: errorMessage
      };
    }
  }
  
  @Tool({
    name: `${PREFIX_TOOL_NAME}readMessage`,
    description: 'Retrieve detailed content of a specific email.',
    parameters: z.object({
      messageId: z.string().describe('ID of the message to retrieve'),
    }),
  })
  async readMessage(params: { messageId: string }, context: Context) {
    this.logger.log('Starting to retrieve message details');
    this.logger.log(`Message ID: ${params.messageId}`);
    
    try {
      // Get Gmail client
      const gmail = await this.gmailService.getGmailClient();
      
      // Retrieve message details
      const response = await gmail.users.messages.get({
        userId: 'me',
        id: params.messageId,
        format: 'full'
      });
      
      const message = response.data;
      if (!message) {
        throw new Error('Message not found');
      }
      
      // Extract header data
      const headers = message.payload?.headers || [];
      const fromHeader = headers.find(h => h.name === 'From');
      const toHeader = headers.find(h => h.name === 'To');
      const subjectHeader = headers.find(h => h.name === 'Subject');
      const dateHeader = headers.find(h => h.name === 'Date');
      
      const from = fromHeader?.value || 'No sender information';
      const to = toHeader?.value || 'No recipient information';
      const subject = subjectHeader?.value || 'No subject';
      const date = dateHeader?.value ? new Date(dateHeader.value).toLocaleString('en-US') : 'No date information';
      
      // Extract email body
      let body = '';
      
      if (message.payload?.body?.data) {
        // Base64 decoding
        const buff = Buffer.from(message.payload.body.data, 'base64');
        body = buff.toString('utf-8');
      } else if (message.payload?.parts) {
        // Process multipart messages
        for (const part of message.payload.parts) {
          if (part.mimeType === 'text/plain' && part.body?.data) {
            const buff = Buffer.from(part.body.data, 'base64');
            body = buff.toString('utf-8');
            break;
          } else if (part.mimeType === 'text/html' && part.body?.data && !body) {
            // Process HTML if plain text is not available
            const buff = Buffer.from(part.body.data, 'base64');
            body = `[HTML Content] ${buff.toString('utf-8').replace(/<[^>]*>/g, ' ')}`;
          }
        }
      }
      
      // Extract attachment information
      const attachments: Array<{filename: string; mimeType: string; size: number}> = [];
      
      if (message.payload?.parts) {
        for (const part of message.payload.parts) {
          if (part.filename && part.body) {
            attachments.push({
              filename: part.filename,
              mimeType: part.mimeType || 'unknown',
              size: part.body.size || 0
            });
          }
        }
      }
      
      // Create response message
      let responseText = `Subject: ${subject}\n`;
      responseText += `From: ${from}\n`;
      responseText += `To: ${to}\n`;
      responseText += `Date: ${date}\n\n`;
      responseText += `${body || 'Unable to retrieve email body'}\n`;
      
      if (attachments.length > 0) {
        responseText += '\nAttachments:\n';
        attachments.forEach((attachment, idx) => {
          responseText += `${idx + 1}. ${attachment.filename} (${attachment.mimeType}, ${this.formatBytes(attachment.size)})\n`;
        });
      }
      
      // Mark message as read
      if (message.labelIds?.includes('UNREAD')) {
        await gmail.users.messages.modify({
          userId: 'me',
          id: params.messageId,
          requestBody: {
            removeLabelIds: ['UNREAD']
          }
        });
        this.logger.log('Message marked as read');
      }
      
      return {
        content: [
          { 
            type: 'text', 
            text: responseText
          }
        ],
        message: {
          id: message.id,
          threadId: message.threadId,
          from,
          to,
          subject,
          date,
          body,
          attachments
        }
      };
    } catch (error: any) {
      this.logger.error('Error retrieving message details:', error);
      const errorMessage = error.message || 'An unknown error occurred';
      
      return {
        content: [
          { 
            type: 'text', 
            text: `Error retrieving message details: ${errorMessage}`
          }
        ],
        error: errorMessage
      };
    }
  }
  
  @Tool({
    name: `${PREFIX_TOOL_NAME}sendMessage`,
    description: 'Compose and send a new email.',
    parameters: z.object({
      to: z.string().describe('Recipient email address'),
      subject: z.string().describe('Email subject'),
      body: z.string().describe('Email body content'),
      cc: z.string().describe('Carbon copy recipients (CC)').optional(),
      bcc: z.string().describe('Blind carbon copy recipients (BCC)').optional(),
    }),
  })
  async sendMessage(params: {
    to: string;
    subject: string;
    body: string;
    cc?: string;
    bcc?: string;
  }, context: Context) {
    this.logger.log('Starting to send email');
    this.logger.log(`Recipient: ${params.to}`);
    this.logger.log(`Subject: ${params.subject}`);
    
    try {
      // Get Gmail client
      const gmail = await this.gmailService.getGmailClient();
      
      // Construct email headers
      let emailLines = [
        `To: ${params.to}`,
        `Subject: ${params.subject}`
      ];
      
      // Add CC and BCC if provided
      if (params.cc) {
        emailLines.push(`Cc: ${params.cc}`);
      }
      
      if (params.bcc) {
        emailLines.push(`Bcc: ${params.bcc}`);
      }
      
      // Add body content
      emailLines.push('', params.body);
      
      // Create email message
      const email = emailLines.join('\r\n');
      
      // Base64 encode
      const encodedEmail = Buffer.from(email).toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');
      
      // Send email request
      const response = await gmail.users.messages.send({
        userId: 'me',
        requestBody: {
          raw: encodedEmail
        }
      });
      
      this.logger.log(`Email sent successfully. Message ID: ${response.data.id}`);
      
      // Create response message
      const responseText = `✅ Email sent successfully!\n\n` +
                           `📧 To: ${params.to}\n` +
                           `📝 Subject: ${params.subject}\n` +
                           `${params.cc ? `📋 CC: ${params.cc}\n` : ''}` +
                           `${params.bcc ? `🔒 BCC: ${params.bcc}\n` : ''}`;
      
      return {
        content: [
          { 
            type: 'text', 
            text: responseText
          }
        ],
        message: {
          id: response.data.id,
          threadId: response.data.threadId,
          to: params.to,
          subject: params.subject,
          body: params.body,
          cc: params.cc,
          bcc: params.bcc
        }
      };
    } catch (error: any) {
      this.logger.error('Error sending email:', error);
      const errorMessage = error.message || 'An unknown error occurred';
      
      return {
        content: [
          { 
            type: 'text', 
            text: `Error sending email: ${errorMessage}`
          }
        ],
        error: errorMessage
      };
    }
  }

  @Tool({
    name: `${PREFIX_TOOL_NAME}searchMessages`,
    description: 'Search for emails using specific criteria.',
    parameters: z.object({
      query: z.string().describe('Gmail search query (e.g., "from:example@gmail.com", "is:unread", "subject:hello")'),
      maxResults: z.number().describe('Maximum number of results').default(10),
    }),
  })
  async searchMessages(params: { 
    query: string;
    maxResults: number;
  }, context: Context) {
    this.logger.log('Starting email search');
    this.logger.log(`Search query: ${params.query}`);
    this.logger.log(`Maximum results: ${params.maxResults}`);
    
    try {
      // Get Gmail client
      const gmail = await this.gmailService.getGmailClient();
      
      // Message search request
      const response = await gmail.users.messages.list({
        userId: 'me',
        q: params.query,
        maxResults: params.maxResults
      });
      
      if (!response.data.messages || response.data.messages.length === 0) {
        return {
          content: [{ 
            type: 'text', 
            text: `No results found for query "${params.query}".` 
          }],
          messages: []
        };
      }
      
      this.logger.log(`Found ${response.data.messages.length} messages.`);
      
      // Retrieve details for each message
      const messagePromises = response.data.messages.map(async (message) => {
        const messageResponse = await gmail.users.messages.get({
          userId: 'me',
          id: message.id as string,
          format: 'metadata',
          metadataHeaders: ['From', 'Subject', 'Date']
        });
        return messageResponse.data;
      });
      
      const messages = await Promise.all(messagePromises);
      
      // Process message data
      const formattedMessages = messages.map(message => {
        // Extract header data
        const headers = message.payload?.headers || [];
        const fromHeader = headers.find(h => h.name === 'From');
        const subjectHeader = headers.find(h => h.name === 'Subject');
        const dateHeader = headers.find(h => h.name === 'Date');
        
        const from = fromHeader?.value || 'No sender information';
        const subject = subjectHeader?.value || 'No subject';
        const date = dateHeader?.value ? new Date(dateHeader.value).toLocaleString('en-US') : 'No date information';
        
        // Process label information
        const isUnread = message.labelIds?.includes('UNREAD') || false;
        
        return {
          id: message.id,
          threadId: message.threadId,
          from,
          subject,
          date,
          snippet: message.snippet || '',
          isUnread,
          labelIds: message.labelIds || []
        };
      });
      
      // Create response message
      const formattedList = formattedMessages.map((msg, idx) => {
        return `${idx + 1}. ${msg.isUnread ? '📮 [UNREAD]' : '📭'} ${msg.subject}\n` +
               `   From: ${msg.from}\n` +
               `   Date: ${msg.date}\n` +
               `   ID: ${msg.id}\n` +
               `   Content: ${msg.snippet}...\n`;
      }).join('\n');
      
      const responseText = `Found ${formattedMessages.length} emails for query "${params.query}".\n\n${formattedList}`;
      
      return {
        content: [
          { 
            type: 'text', 
            text: responseText
          }
        ],
        messages: formattedMessages
      };
    } catch (error: any) {
      this.logger.error('Error searching emails:', error);
      const errorMessage = error.message || 'An unknown error occurred';
      
      return {
        content: [
          { 
            type: 'text', 
            text: `Error searching emails: ${errorMessage}`
          }
        ],
        error: errorMessage
      };
    }
  }

  /**
   * Convert byte size to readable format
   */
  private formatBytes(bytes: number, decimals: number = 2): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
    
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  }
}