import { Injectable, Logger } from '@nestjs/common';
import { Tool, Context } from '@rekog/mcp-nest';
import { z } from 'zod';
import { DriveService } from './drive.service';
import { PREFIX_TOOL_NAME } from './constants';
import * as fs from 'fs';
import * as stream from 'stream';
import * as util from 'util';
import * as path from 'path';

const pipeline = util.promisify(stream.pipeline);

@Injectable()
export class DriveTool {
  private readonly logger = new Logger(DriveTool.name);
  
  constructor(
    private readonly driveService: DriveService
  ) {}

  @Tool({
    name: `${PREFIX_TOOL_NAME}listFiles`,
    description: 'Search and retrieve files from Google Drive. By default, returns the 10 most recent files. Supports full Google Drive search query syntax including non-English text searches.\n\n' +
    '- For the "query" parameter: You can use a simple keyword like "제품 기획" or "회의록", or full Google Drive query syntax like "name contains \'document\'". Simple keywords will be automatically converted to proper search queries.\n' + 
    '- Example queries: "제품 기획" (searches for this Korean text), "회의록" (searches for meeting notes), "name contains \'budget\'", "mimeType=\'application/pdf\'", "modifiedTime > \'2023-01-01\'"\n' +
    '- To search for files in Korean, simply use the Korean keyword directly as your query parameter value.',
    parameters: z.object({
      maxResults: z.number().describe('Maximum number of results (default: 10)').default(10),
      query: z.string().describe('Google Drive search query. Can be a simple keyword like "제품 기획" (automatically processed) or full query syntax.').optional(),
      folderId: z.string().describe('ID of the folder to list files from').optional(),
    }),
  })
  async listFiles(params: { 
    maxResults: number;
    query?: string;
    folderId?: string;
  }, context: Context) {
    this.logger.log('Starting to retrieve file list');
    this.logger.log(`Maximum results: ${params.maxResults}`);
    if (params.query) {
      this.logger.log(`Search query: ${params.query}`);
    }
    if (params.folderId) {
      this.logger.log(`Folder ID: ${params.folderId}`);
    }
    
    try {
      // Get Drive client
      const drive = await this.driveService.getDriveClient();
      
      // Create file list request
      let queryString = '';
      
      // Add folder ID to query if provided
      if (params.folderId) {
        queryString = `'${params.folderId}' in parents`;
      }
      
      // Add additional query parameters if provided
      if (params.query) {
        if (queryString) {
          queryString += ' and ';
        }
        
        // Process query to ensure it's in the correct format
        let processedQuery = params.query.trim();
        
        // If it seems like a simple keyword without operators, auto-format it as a name search
        if (!processedQuery.includes(' contains ') && !processedQuery.includes('=') && 
            !processedQuery.includes('>') && !processedQuery.includes('<') && 
            !processedQuery.includes(' in ') && !processedQuery.includes(' or ') && 
            !processedQuery.includes(' and ')) {
          
          // Check if the query is already wrapped in quotes
          if (!(processedQuery.startsWith("'") && processedQuery.endsWith("'")) && 
              !(processedQuery.startsWith('"') && processedQuery.endsWith('"'))) {
            // If not wrapped in quotes, wrap it with single quotes
            processedQuery = `name contains '${processedQuery}'`;
          }
        }
        
        this.logger.log(`Processed query: ${processedQuery}`);
        queryString += processedQuery;
      }
      
      // Create request
      const listRequest: any = {
        pageSize: params.maxResults,
        fields: 'nextPageToken, files(id, name, mimeType, webViewLink, iconLink, createdTime, modifiedTime, size, parents, shared)'
      };
      
      if (queryString) {
        listRequest.q = queryString;
      }
      
      // Execute request
      const response = await drive.files.list(listRequest);
      
      // Check if files were found
      if (!response.data.files || response.data.files.length === 0) {
        return {
          content: [{ 
            type: 'text', 
            text: 'No files found.' 
          }],
          files: []
        };
      }
      
      this.logger.log(`Retrieved ${response.data.files.length} files`);
      
      // Map file data
      const files = response.data.files.map(file => ({
        id: file.id,
        name: file.name,
        mimeType: file.mimeType,
        webViewLink: file.webViewLink,
        iconLink: file.iconLink,
        createdTime: file.createdTime,
        modifiedTime: file.modifiedTime,
        size: file.size,
        isFolder: file.mimeType === 'application/vnd.google-apps.folder',
        parents: file.parents,
        shared: file.shared
      }));
      
      // Create response message
      const formattedList = files.map((file, idx) => {
        const icon = file.isFolder ? '📁' : '📄';
        const size = file.size ? `${Math.round(parseInt(file.size) / 1024)} KB` : 'N/A';
        return `${idx + 1}. ${icon} ${file.name}\n` +
               `   Type: ${file.mimeType}\n` +
               `   Created: ${new Date(file.createdTime || '').toLocaleString('en-US')}\n` + 
               `   Modified: ${new Date(file.modifiedTime || '').toLocaleString('en-US')}\n` +
               `   Size: ${size}\n` + 
               `   ID: ${file.id}\n`;
      }).join('\n');
      
      const responseText = `Found ${files.length} files.\n\n${formattedList}`;
      
      return {
        content: [
          { 
            type: 'text', 
            text: responseText
          }
        ],
        files
      };
    } catch (error: any) {
      this.logger.error('Error retrieving file list:', error);
      const errorMessage = error.message || 'An unknown error occurred';
      
      return {
        content: [
          { 
            type: 'text', 
            text: `Error retrieving file list: ${errorMessage}`
          }
        ],
        error: errorMessage
      };
    }
  }

  @Tool({
    name: `${PREFIX_TOOL_NAME}getFileDetails`,
    description: 'Get detailed information about a specific file or folder.',
    parameters: z.object({
      fileId: z.string().describe('ID of the file or folder to retrieve details for'),
    }),
  })
  async getFileDetails(params: { fileId: string }, context: Context) {
    this.logger.log('Starting to retrieve file details');
    this.logger.log(`File ID: ${params.fileId}`);
    
    try {
      // Get Drive client
      const drive = await this.driveService.getDriveClient();
      
      // Get file details
      const response = await drive.files.get({
        fileId: params.fileId,
        fields: '*'  // Request all available fields
      });
      
      const file = response.data;
      
      if (!file) {
        throw new Error('File not found');
      }
      
      // Format file details
      const isFolder = file.mimeType === 'application/vnd.google-apps.folder';
      const icon = isFolder ? '📁' : '📄';
      const size = file.size ? `${Math.round(parseInt(file.size) / 1024)} KB` : 'N/A';
      
      const formattedDetails = 
        `${icon} ${file.name}\n\n` +
        `Type: ${file.mimeType}\n` +
        `Size: ${size}\n` +
        `Created: ${new Date(file.createdTime || '').toLocaleString('en-US')}\n` +
        `Modified: ${new Date(file.modifiedTime || '').toLocaleString('en-US')}\n` +
        `Owner: ${file.owners?.map(owner => owner.displayName).join(', ') || 'Unknown'}\n` +
        `Shared: ${file.shared ? 'Yes' : 'No'}\n` +
        `Web View Link: ${file.webViewLink || 'N/A'}\n` +
        `Download Link: ${file.webContentLink || 'N/A'}\n`;
      
      return {
        content: [
          { 
            type: 'text', 
            text: formattedDetails
          }
        ],
        file
      };
    } catch (error: any) {
      this.logger.error('Error retrieving file details:', error);
      const errorMessage = error.message || 'An unknown error occurred';
      
      return {
        content: [
          { 
            type: 'text', 
            text: `Error retrieving file details: ${errorMessage}`
          }
        ],
        error: errorMessage
      };
    }
  }

  @Tool({
    name: `${PREFIX_TOOL_NAME}createFolder`,
    description: 'Create a new folder in Google Drive.',
    parameters: z.object({
      name: z.string().describe('Name of the folder to create'),
      parentId: z.string().describe('ID of the parent folder').optional(),
    }),
  })
  async createFolder(params: { 
    name: string;
    parentId?: string;
  }, context: Context) {
    this.logger.log('Starting to create folder');
    this.logger.log(`Folder name: ${params.name}`);
    if (params.parentId) {
      this.logger.log(`Parent folder ID: ${params.parentId}`);
    }
    
    try {
      // Get Drive client
      const drive = await this.driveService.getDriveClient();
      
      // Create folder metadata
      const fileMetadata: any = {
        name: params.name,
        mimeType: 'application/vnd.google-apps.folder'
      };
      
      // Add parent folder if specified
      if (params.parentId) {
        fileMetadata.parents = [params.parentId];
      }
      
      // Create the folder
      const response = await drive.files.create({
        requestBody: fileMetadata,
        fields: 'id, name, webViewLink'
      });
      
      const folder = response.data;
      
      this.logger.log(`Folder created successfully. ID: ${folder.id}`);
      
      return {
        content: [
          { 
            type: 'text', 
            text: `Folder "${folder.name}" has been created successfully.\nFolder ID: ${folder.id}\nWeb Link: ${folder.webViewLink}`
          }
        ],
        folder
      };
    } catch (error: any) {
      this.logger.error('Error creating folder:', error);
      const errorMessage = error.message || 'An unknown error occurred';
      
      return {
        content: [
          { 
            type: 'text', 
            text: `Error creating folder: ${errorMessage}`
          }
        ],
        error: errorMessage
      };
    }
  }

  @Tool({
    name: `${PREFIX_TOOL_NAME}uploadFile`,
    description: 'Upload a file to Google Drive.',
    parameters: z.object({
      filePath: z.string().describe('Path to the local file to upload'),
      name: z.string().describe('Name to give the file in Google Drive').optional(),
      parentId: z.string().describe('ID of the parent folder in Google Drive').optional(),
      mimeType: z.string().describe('MIME type of the file').optional(),
    }),
  })
  async uploadFile(params: { 
    filePath: string;
    name?: string;
    parentId?: string;
    mimeType?: string;
  }, context: Context) {
    this.logger.log('Starting to upload file');
    this.logger.log(`File path: ${params.filePath}`);
    
    try {
      // Check if file exists
      if (!fs.existsSync(params.filePath)) {
        throw new Error(`File not found: ${params.filePath}`);
      }
      
      // Get file stats
      const stats = fs.statSync(params.filePath);
      
      // Check if it's a file
      if (!stats.isFile()) {
        throw new Error(`Not a file: ${params.filePath}`);
      }
      
      // Get Drive client
      const drive = await this.driveService.getDriveClient();
      
      // Determine file name
      const name = params.name || path.basename(params.filePath);
      
      // Create file metadata
      const fileMetadata: any = {
        name: name
      };
      
      // Add parent folder if specified
      if (params.parentId) {
        fileMetadata.parents = [params.parentId];
      }
      
      // Determine MIME type
      const mimeType = params.mimeType || 'application/octet-stream';
      
      // Create media object
      const media = {
        mimeType: mimeType,
        body: fs.createReadStream(params.filePath)
      };
      
      // Upload the file
      const response = await drive.files.create({
        requestBody: fileMetadata,
        media: media,
        fields: 'id, name, mimeType, webViewLink, size'
      });
      
      const file = response.data;
      
      this.logger.log(`File uploaded successfully. ID: ${file.id}`);
      
      return {
        content: [
          { 
            type: 'text', 
            text: `File "${file.name}" has been uploaded successfully.\nFile ID: ${file.id}\nSize: ${Math.round(parseInt(file.size || '0') / 1024)} KB\nWeb Link: ${file.webViewLink}`
          }
        ],
        file
      };
    } catch (error: any) {
      this.logger.error('Error uploading file:', error);
      const errorMessage = error.message || 'An unknown error occurred';
      
      return {
        content: [
          { 
            type: 'text', 
            text: `Error uploading file: ${errorMessage}`
          }
        ],
        error: errorMessage
      };
    }
  }

  @Tool({
    name: `${PREFIX_TOOL_NAME}downloadFile`,
    description: 'Download a file from Google Drive to a local destination.',
    parameters: z.object({
      fileId: z.string().describe('ID of the file to download'),
      destinationPath: z.string().describe('Local path where to save the downloaded file'),
    }),
  })
  async downloadFile(params: { 
    fileId: string;
    destinationPath: string;
  }, context: Context) {
    this.logger.log('Starting to download file');
    this.logger.log(`File ID: ${params.fileId}`);
    this.logger.log(`Destination path: ${params.destinationPath}`);
    
    try {
      // Get Drive client
      const drive = await this.driveService.getDriveClient();
      
      // Get file metadata to get the name
      const metadata = await drive.files.get({
        fileId: params.fileId,
        fields: 'name, mimeType, size'
      });
      
      const fileName = metadata.data.name;
      const mimeType = metadata.data.mimeType;
      const size = metadata.data.size ? parseInt(metadata.data.size) : 0;
      
      // For Google Docs, Sheets, etc., export the file
      if (mimeType && mimeType.includes('application/vnd.google-apps')) {
        let exportMimeType;
        
        // Determine export format based on the Google Apps type
        if (mimeType === 'application/vnd.google-apps.document') {
          exportMimeType = 'application/pdf';
        } else if (mimeType === 'application/vnd.google-apps.spreadsheet') {
          exportMimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
        } else if (mimeType === 'application/vnd.google-apps.presentation') {
          exportMimeType = 'application/vnd.openxmlformats-officedocument.presentationml.presentation';
        } else {
          exportMimeType = 'application/pdf'; // Default export format
        }
        
        // Export the file
        const response = await drive.files.export({
          fileId: params.fileId,
          mimeType: exportMimeType
        }, { responseType: 'stream' });
        
        const destination = fs.createWriteStream(params.destinationPath);
        
        if (response.data) {
          await pipeline(response.data, destination);
        } else {
          throw new Error('No data received from export');
        }
      } else {
        // Regular file download
        const response = await drive.files.get({
          fileId: params.fileId,
          alt: 'media'
        }, { responseType: 'stream' });
        
        const destination = fs.createWriteStream(params.destinationPath);
        
        if (response.data) {
          await pipeline(response.data, destination);
        } else {
          throw new Error('No data received from download');
        }
      }
      
      this.logger.log(`File downloaded successfully to ${params.destinationPath}`);
      
      return {
        content: [
          { 
            type: 'text', 
            text: `File "${fileName}" has been downloaded successfully to ${params.destinationPath}.\nSize: ${Math.round(size / 1024)} KB`
          }
        ],
        filePath: params.destinationPath,
        fileName,
        size
      };
    } catch (error: any) {
      this.logger.error('Error downloading file:', error);
      const errorMessage = error.message || 'An unknown error occurred';
      
      return {
        content: [
          { 
            type: 'text', 
            text: `Error downloading file: ${errorMessage}`
          }
        ],
        error: errorMessage
      };
    }
  }

  @Tool({
    name: `${PREFIX_TOOL_NAME}deleteFile`,
    description: 'Permanently delete a file or folder from Google Drive.',
    parameters: z.object({
      fileId: z.string().describe('ID of the file or folder to delete'),
    }),
  })
  async deleteFile(params: { fileId: string }, context: Context) {
    this.logger.log('Starting to delete file/folder');
    this.logger.log(`File/Folder ID: ${params.fileId}`);
    
    try {
      // Get Drive client
      const drive = await this.driveService.getDriveClient();
      
      // Get file name before deletion
      const metadata = await drive.files.get({
        fileId: params.fileId,
        fields: 'name, mimeType'
      });
      
      const fileName = metadata.data.name;
      const isFolder = metadata.data.mimeType === 'application/vnd.google-apps.folder';
      
      // Delete the file/folder
      await drive.files.delete({
        fileId: params.fileId
      });
      
      this.logger.log(`File/Folder deleted successfully. ID: ${params.fileId}`);
      
      return {
        content: [
          { 
            type: 'text', 
            text: `${isFolder ? 'Folder' : 'File'} "${fileName}" has been deleted successfully.`
          }
        ],
        success: true,
        fileName,
        isFolder
      };
    } catch (error: any) {
      this.logger.error('Error deleting file/folder:', error);
      const errorMessage = error.message || 'An unknown error occurred';
      
      return {
        content: [
          { 
            type: 'text', 
            text: `Error deleting file/folder: ${errorMessage}`
          }
        ],
        error: errorMessage
      };
    }
  }

  @Tool({
    name: `${PREFIX_TOOL_NAME}shareFile`,
    description: 'Share a file or folder with specific users or make it publicly accessible.',
    parameters: z.object({
      fileId: z.string().describe('ID of the file or folder to share'),
      email: z.string().describe('Email address of the user to share with').optional(),
      role: z.enum(['reader', 'commenter', 'writer', 'fileOrganizer', 'organizer', 'owner']).describe('Permission role to grant').default('reader'),
      type: z.enum(['user', 'group', 'domain', 'anyone']).describe('Type of the grantee').default('user'),
      domain: z.string().describe('Domain for domain-type permissions').optional(),
      allowDiscovery: z.boolean().describe('Whether the file can be discovered through search').default(false),
      message: z.string().describe('Custom message to include in notification emails').optional(),
    }),
  })
  async shareFile(params: { 
    fileId: string;
    email?: string;
    role: string;
    type: string;
    domain?: string;
    allowDiscovery: boolean;
    message?: string;
  }, context: Context) {
    this.logger.log('Starting to share file/folder');
    this.logger.log(`File/Folder ID: ${params.fileId}`);
    this.logger.log(`Sharing with type: ${params.type}, role: ${params.role}`);
    
    try {
      // Get Drive client
      const drive = await this.driveService.getDriveClient();
      
      // Get file name for better response
      const metadata = await drive.files.get({
        fileId: params.fileId,
        fields: 'name, mimeType'
      });
      
      const fileName = metadata.data.name;
      const isFolder = metadata.data.mimeType === 'application/vnd.google-apps.folder';
      
      // Create permission
      const permissionBody: any = {
        role: params.role,
        type: params.type
      };
      
      // Add email if required
      if (params.type === 'user' || params.type === 'group') {
        if (!params.email) {
          throw new Error('Email is required when sharing with a user or group');
        }
        permissionBody.emailAddress = params.email;
      } else if (params.type === 'domain') {
        if (!params.domain) {
          throw new Error('Domain is required when sharing with a domain');
        }
        permissionBody.domain = params.domain;
      }
      
      // For anyone-type permissions
      if (params.type === 'anyone') {
        permissionBody.allowFileDiscovery = params.allowDiscovery;
      }
      
      // Create the permission
      const response = await drive.permissions.create({
        fileId: params.fileId,
        requestBody: permissionBody,
        emailMessage: params.message,
        sendNotificationEmail: !!params.message
      });
      
      this.logger.log(`File/Folder shared successfully. ID: ${params.fileId}`);
      
      // Create response message
      let sharingDetails;
      if (params.type === 'anyone') {
        sharingDetails = `anyone (${params.role})`;
      } else if (params.type === 'domain') {
        sharingDetails = `domain ${params.domain || ''} (${params.role})`;
      } else {
        sharingDetails = `${params.email || ''} (${params.role})`;
      }
      
      return {
        content: [
          { 
            type: 'text', 
            text: `${isFolder ? 'Folder' : 'File'} "${fileName}" has been shared successfully with ${sharingDetails}.`
          }
        ],
        permission: response.data
      };
    } catch (error: any) {
      this.logger.error('Error sharing file/folder:', error);
      const errorMessage = error.message || 'An unknown error occurred';
      
      return {
        content: [
          { 
            type: 'text', 
            text: `Error sharing file/folder: ${errorMessage}`
          }
        ],
        error: errorMessage
      };
    }
  }

  @Tool({
    name: `${PREFIX_TOOL_NAME}moveFile`,
    description: 'Move a file or folder to a different folder in Google Drive.',
    parameters: z.object({
      fileId: z.string().describe('ID of the file or folder to move'),
      newParentId: z.string().describe('ID of the destination folder'),
      keepParents: z.boolean().describe('Whether to keep the file in its current folders').default(false),
    }),
  })
  async moveFile(params: { 
    fileId: string;
    newParentId: string;
    keepParents: boolean;
  }, context: Context) {
    this.logger.log('Starting to move file/folder');
    this.logger.log(`File/Folder ID: ${params.fileId}`);
    this.logger.log(`Destination folder ID: ${params.newParentId}`);
    
    try {
      // Get Drive client
      const drive = await this.driveService.getDriveClient();
      
      // Get file name for better response
      const metadata = await drive.files.get({
        fileId: params.fileId,
        fields: 'name, mimeType'
      });
      
      const fileName = metadata.data.name;
      const isFolder = metadata.data.mimeType === 'application/vnd.google-apps.folder';
      
      // Get destination folder name
      const destinationMetadata = await drive.files.get({
        fileId: params.newParentId,
        fields: 'name'
      });
      
      const destinationName = destinationMetadata.data.name;
      
      // Move the file/folder
      await drive.files.update({
        fileId: params.fileId,
        addParents: params.newParentId,
        removeParents: params.keepParents ? undefined : 'root',
        fields: 'id, parents'
      });
      
      this.logger.log(`File/Folder moved successfully. ID: ${params.fileId}`);
      
      return {
        content: [
          { 
            type: 'text', 
            text: `${isFolder ? 'Folder' : 'File'} "${fileName}" has been moved successfully to folder "${destinationName}".`
          }
        ],
        success: true,
        fileName,
        destinationName,
        isFolder
      };
    } catch (error: any) {
      this.logger.error('Error moving file/folder:', error);
      const errorMessage = error.message || 'An unknown error occurred';
      
      return {
        content: [
          { 
            type: 'text', 
            text: `Error moving file/folder: ${errorMessage}`
          }
        ],
        error: errorMessage
      };
    }
  }
}
