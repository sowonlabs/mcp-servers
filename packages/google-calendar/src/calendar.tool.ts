import { Injectable, Logger } from '@nestjs/common';
import { Tool, Context } from '@rekog/mcp-nest';
import { z } from 'zod';
import { CalendarService } from './calendar.service';
import { PREFIX_TOOL_NAME } from './constants';

@Injectable()
export class CalendarTool {
  private readonly logger = new Logger(CalendarTool.name);
  
  constructor(
    private readonly calendarService: CalendarService
  ) {}

  @Tool({
    name: `${PREFIX_TOOL_NAME}listCalendars`,
    description: 'Retrieves the list of Google calendars for the user. This tool lists all calendars connected to your Google Calendar account.',
    parameters: z.object({}),
  })
  async listCalendars(params: Record<string, never>, context: Context) {
    this.logger.log('Starting to retrieve calendar list');
    
    try {
      // Get calendar client
      const calendar = await this.calendarService.getCalendarClient();
      
      // Get calendar list
      const response = await calendar.calendarList.list();
      const calendars = response.data.items || [];
      
      this.logger.log(`Found ${calendars.length} calendars.`);
      
      const calendarList = calendars.map(calendar => ({
        id: calendar.id,
        summary: calendar.summary,
        description: calendar.description,
        primary: calendar.primary,
        timeZone: calendar.timeZone,
        backgroundColor: calendar.backgroundColor,
        accessRole: calendar.accessRole
      }));
      
      // Convert calendar list to text format
      const calendarListText = calendarList.map(cal => {
        return `- ${cal.summary || 'Unnamed calendar'}${cal.primary ? ' (Primary)' : ''}\n  ID: ${cal.id}\n  ${cal.description ? 'Description: ' + cal.description + '\n  ' : ''}Time Zone: ${cal.timeZone || 'Not specified'}`;
      }).join('\n\n');
      
      return {
        content: [
          { 
            type: 'text', 
            text: `Found ${calendars.length} calendars.\n\n${calendarListText}`
          }
        ],
        calendars: calendarList
      };
    } catch (error: any) {
      this.logger.error('Error retrieving calendar list:', error);
      const errorMessage = error.message || 'An unknown error occurred';
      
      return {
        content: [
          { 
            type: 'text', 
            text: `Error retrieving calendar list: ${errorMessage}`
          }
        ],
        error: errorMessage
      };
    }
  }
  
  @Tool({
    name: `${PREFIX_TOOL_NAME}listEvents`,
    description: 'Retrieves events from the specified Google calendar. This tool fetches events from your Google Calendar. If no time range is specified, it retrieves events for the next 7 days from the current date.',
    parameters: z.object({
      calendarId: z.string().describe('The calendar ID to retrieve events from (default: primary)').default('primary'),
      timeMin: z.string().describe('The start time for retrieving events (ISO format date string)').optional(),
      timeMax: z.string().describe('The end time for retrieving events (ISO format date string)').optional(),
    }),
  })
  async listEvents(params: { 
    calendarId: string;
    timeMin?: string;
    timeMax?: string; 
  }, context: Context) {
    this.logger.log('Starting to retrieve calendar events');
    this.logger.log(`Calendar ID: ${params.calendarId}`);
    
    try {
      // Get calendar client
      const calendar = await this.calendarService.getCalendarClient();
      
      // Set request parameters for retrieving events
      const requestParams: any = {
        calendarId: params.calendarId,
        singleEvents: true,
        orderBy: 'startTime',
      };
      
      // Set default time range (-7 days to +7 days)
      const now = new Date();
      if (!params.timeMin) {
        const min = new Date(now);
        min.setDate(now.getDate() - 7);
        requestParams.timeMin = min.toISOString();
        this.logger.log(`timeMin not specified, setting to current time: ${requestParams.timeMin}`);
      } else {
        requestParams.timeMin = params.timeMin;
      }
      
      if (!params.timeMax) {
        const max = new Date(now);
        max.setDate(now.getDate() + 7);
        requestParams.timeMax = max.toISOString();
        this.logger.log(`timeMax not specified, setting to 7 days from now: ${requestParams.timeMax}`);
      } else {
        requestParams.timeMax = params.timeMax;
      }
      
      // Get event list
      const response = await calendar.events.list(requestParams);
      const events = response.data.items || [];
      
      this.logger.log(`Found ${events.length} events.`);
      
      // Create text for time period
      const startDate = new Date(requestParams.timeMin);
      const endDate = new Date(requestParams.timeMax);
      const periodText = `Events from ${this.formatDate(startDate)} to ${this.formatDate(endDate)}.`;
      
      // Process event data
      const eventList = events.map(event => ({
        id: event.id,
        summary: event.summary,
        description: event.description,
        location: event.location,
        start: event.start,
        end: event.end,
        status: event.status,
        created: event.created,
        updated: event.updated,
        organizer: event.organizer,
        attendees: event.attendees
      }));
      
      // Format events
      const formattedEvents = this.formatEventList(eventList);
      
      return {
        content: [
          { 
            type: 'text', 
            text: `${periodText}\nFound ${events.length} events.\n\n${formattedEvents}`
          }
        ],
        events: eventList,
        period: {
          start: requestParams.timeMin,
          end: requestParams.timeMax
        }
      };
    } catch (error: any) {
      this.logger.error('Error retrieving calendar events:', error);
      const errorMessage = error.message || 'An unknown error occurred';
      
      return {
        content: [
          { 
            type: 'text', 
            text: `Error retrieving calendar events: ${errorMessage}`
          }
        ],
        error: errorMessage
      };
    }
  }
  
  @Tool({
    name: `${PREFIX_TOOL_NAME}createEvent`,
    description: 'Creates a new event in the specified Google Calendar. This tool allows you to schedule events with various details such as title, location, description, and time information.',
    parameters: z.object({
      calendarId: z.string().describe('The calendar ID to create the event in (default: primary)').default('primary'),
      summary: z.string().describe('The title or summary of the event'),
      location: z.string().describe('The location of the event').optional(),
      description: z.string().describe('A detailed description of the event').optional(),
      start: z.object({
        dateTime: z.string().describe('The start time of the event in ISO format (e.g., "2025-05-10T09:00:00+09:00")'),
        timeZone: z.string().describe('The timezone for the start time (e.g., "Asia/Seoul")').optional(),
      }),
      end: z.object({
        dateTime: z.string().describe('The end time of the event in ISO format (e.g., "2025-05-10T10:00:00+09:00")'),
        timeZone: z.string().describe('The timezone for the end time (e.g., "Asia/Seoul")').optional(),
      }),
      attendees: z.array(
        z.object({
          email: z.string().describe('Email address of the attendee'),
          displayName: z.string().describe('Display name of the attendee').optional(),
        })
      ).describe('List of attendees for the event').optional(),
      reminders: z.object({
        useDefault: z.boolean().describe('Whether to use the default reminders or not').optional(),
        overrides: z.array(
          z.object({
            method: z.enum(['email', 'popup']).describe('The method of reminder notification'),
            minutes: z.number().describe('Minutes before the event to trigger the reminder'),
          })
        ).describe('Custom reminder settings').optional(),
      }).optional(),
    }),
  })
  async createEvent(params: {
    calendarId: string;
    summary: string;
    location?: string;
    description?: string;
    start: {
      dateTime: string;
      timeZone?: string;
    };
    end: {
      dateTime: string;
      timeZone?: string;
    };
    attendees?: Array<{
      email: string;
      displayName?: string;
    }>;
    reminders?: {
      useDefault?: boolean;
      overrides?: Array<{
        method: 'email' | 'popup';
        minutes: number;
      }>;
    };
  }, context: Context) {
    this.logger.log('Starting to create calendar event');
    this.logger.log(`Calendar ID: ${params.calendarId}`);
    this.logger.log(`Event summary: ${params.summary}`);
    
    try {
      // Get calendar client
      const calendar = await this.calendarService.getCalendarClient();
      
      // Prepare event data
      const eventData = {
        summary: params.summary,
        location: params.location,
        description: params.description,
        start: params.start,
        end: params.end,
        attendees: params.attendees,
        reminders: params.reminders || { useDefault: true },
      };
      
      // Create event
      const response = await calendar.events.insert({
        calendarId: params.calendarId,
        requestBody: eventData,
        sendUpdates: 'all', // Sends email notifications to attendees
      });
      
      if (!response || !response.data) {
        throw new Error('Failed to create event: No response data received');
      }
      
      this.logger.log(`Event created successfully. Event ID: ${response.data.id}`);
      
      // Format created event details
      const createdEvent = response.data;
      const start = createdEvent.start?.dateTime || createdEvent.start?.date || 'Date not specified';
      const end = createdEvent.end?.dateTime || createdEvent.end?.date || 'Date not specified';
      const startDate = new Date(start);
      const endDate = new Date(end);
      
      // Create response message
      let responseText = `✅ 이벤트가 성공적으로 생성되었습니다!\n\n`;
      responseText += `📅 ${createdEvent.summary || 'No title'}\n`;
      responseText += `🕒 ${this.formatDateTime(startDate)} - ${this.formatDateTime(endDate)}\n`;
      
      if (createdEvent.location) {
        responseText += `📍 ${createdEvent.location}\n`;
      }
      
      if (createdEvent.description) {
        responseText += `📝 ${createdEvent.description}\n`;
      }
      
      if (createdEvent.attendees && createdEvent.attendees.length > 0) {
        responseText += `👥 참석자: ${createdEvent.attendees.map(a => a.email).join(', ')}\n`;
      }
      
      if (createdEvent.htmlLink) {
        responseText += `\n🔗 이벤트 링크: ${createdEvent.htmlLink}\n`;
      }
      
      return {
        content: [
          { 
            type: 'text', 
            text: responseText
          }
        ],
        event: {
          id: createdEvent.id,
          summary: createdEvent.summary,
          description: createdEvent.description,
          location: createdEvent.location,
          start: createdEvent.start,
          end: createdEvent.end,
          status: createdEvent.status,
          htmlLink: createdEvent.htmlLink,
          created: createdEvent.created,
          updated: createdEvent.updated,
          organizer: createdEvent.organizer,
          attendees: createdEvent.attendees
        }
      };
    } catch (error: any) {
      this.logger.error('Error creating calendar event:', error);
      const errorMessage = error.message || 'An unknown error occurred';
      
      return {
        content: [
          { 
            type: 'text', 
            text: `이벤트 생성 중 오류가 발생했습니다: ${errorMessage}`
          }
        ],
        error: errorMessage
      };
    }
  }
  
  /**
   * Format event list to readable text format
   */
  private formatEventList(events: any[]): string {
    if (events.length === 0) {
      return 'No events scheduled for this period.';
    }
    
    return events.map(event => {
      const start = event.start?.dateTime || event.start?.date || 'Date not specified';
      const end = event.end?.dateTime || event.end?.date || 'Date not specified';
      const startDate = new Date(start);
      const endDate = new Date(end);
      
      let formattedEvent = `📅 ${event.summary || 'No title'}\n`;
      formattedEvent += `🕒 ${this.formatDateTime(startDate)} - ${this.formatDateTime(endDate)}\n`;
      
      if (event.location) {
        formattedEvent += `📍 ${event.location}\n`;
      }
      
      if (event.description) {
        formattedEvent += `📝 ${event.description}\n`;
      }
      
      return formattedEvent;
    }).join('\n\n');
  }
  
  /**
   * Format date to readable format
   */
  private formatDateTime(date: Date): string {
    try {
      return date.toLocaleString('ko-KR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    } catch {
      return 'Date not specified';
    }
  }

  /**
   * Format date only to readable format (excluding time)
   */
  private formatDate(date: Date): string {
    try {
      return date.toLocaleString('ko-KR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return 'Date not specified';
    }
  }
}