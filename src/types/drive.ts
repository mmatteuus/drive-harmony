export interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  modifiedTime?: string;
  size?: string;
  parents?: string[];
  webViewLink?: string;
  appProperties?: Record<string, string>;
  iconLink?: string;
  thumbnailLink?: string;
  hasThumbnail?: boolean;
  owners?: Array<{ displayName?: string; emailAddress?: string }>;
}

