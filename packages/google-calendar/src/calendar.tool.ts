import { Injectable, Logger } from '@nestjs/common';
import { Tool, Context } from '@rekog/mcp-nest';
import { z } from 'zod';
import { AuthService } from './auth/auth.service';

@Injectable()
export class CalendarTool {
  private readonly logger = new Logger(CalendarTool.name);
  
  constructor(
    private readonly authService: AuthService
  ) {}

  @Tool({
    name: 'listCalendars',
    description: 'Retrieves the list of Google calendars for the user. This tool lists all calendars connected to your Google Calendar account.',
    parameters: z.object({}),
  })
  async listCalendars(params: Record<string, never>, context: Context) {
    this.logger.log('Starting to retrieve calendar list');
    
    try {
      // Get calendar client
      const calendar = await this.authService.getCalendarClient();
      
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
    name: 'listEvents',
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
      const calendar = await this.authService.getCalendarClient();
      
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