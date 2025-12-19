export type DriveFile = {
  id: string;
  name: string;
  mimeType: string;
  modifiedTime?: string;
  size?: string;
  parents?: string[];
  thumbnailLink?: string;
  iconLink?: string;
  webViewLink?: string;
  hasThumbnail?: boolean;
  appProperties?: Record<string, string>;
};

const DRIVE_BASE = "https://www.googleapis.com/drive/v3";
const SHEETS_BASE = "https://sheets.googleapis.com/v4";

export const requireAccessToken = (authHeader?: string) => {
  const value = authHeader ?? "";
  const match = value.match(/^Bearer\s+(.+)$/i);
  if (!match) throw new Error("missing_access_token");
  return match[1];
};

export const driveGetFile = async (accessToken: string, fileId: string) => {
  const url = new URL(`${DRIVE_BASE}/files/${encodeURIComponent(fileId)}`);
  url.searchParams.set(
    "fields",
    "id,name,mimeType,modifiedTime,size,parents,thumbnailLink,iconLink,webViewLink,hasThumbnail,appProperties",
  );

  const response = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!response.ok) throw new Error(`drive_get_failed_${response.status}`);
  return (await response.json()) as DriveFile;
};

export const drivePatchAppProperties = async (
  accessToken: string,
  fileId: string,
  appProperties: Record<string, string>,
) => {
  const url = new URL(`${DRIVE_BASE}/files/${encodeURIComponent(fileId)}`);
  url.searchParams.set("fields", "id,appProperties");

  const response = await fetch(url.toString(), {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ appProperties }),
  });
  if (!response.ok) throw new Error(`drive_patch_failed_${response.status}`);
  return (await response.json()) as Pick<DriveFile, "id" | "appProperties">;
};

export const driveListFilesInFolder = async (accessToken: string, folderId: string, pageToken?: string) => {
  const url = new URL(`${DRIVE_BASE}/files`);
  url.searchParams.set("q", `'${folderId.replace(/'/g, "\\'")}' in parents and trashed = false`);
  url.searchParams.set(
    "fields",
    "nextPageToken,files(id,name,mimeType,modifiedTime,size,parents,thumbnailLink,iconLink,webViewLink,hasThumbnail,appProperties)",
  );
  url.searchParams.set("pageSize", "100");
  if (pageToken) url.searchParams.set("pageToken", pageToken);

  const response = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!response.ok) throw new Error(`drive_list_failed_${response.status}`);
  return (await response.json()) as { nextPageToken?: string; files?: DriveFile[] };
};

export const driveCreateFolder = async (
  accessToken: string,
  input: { name: string; parentId?: string; appProperties?: Record<string, string> },
) => {
  const url = new URL(`${DRIVE_BASE}/files`);
  url.searchParams.set("fields", "id,name,mimeType,parents,webViewLink,appProperties");

  const response = await fetch(url.toString(), {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name: input.name,
      mimeType: "application/vnd.google-apps.folder",
      parents: input.parentId ? [input.parentId] : undefined,
      appProperties: input.appProperties,
    }),
  });

  if (!response.ok) throw new Error(`drive_create_folder_failed_${response.status}`);
  return (await response.json()) as DriveFile;
};

export const driveCreateSpreadsheet = async (
  accessToken: string,
  input: { name: string; parentId?: string; appProperties?: Record<string, string> },
) => {
  const url = new URL(`${DRIVE_BASE}/files`);
  url.searchParams.set("fields", "id,name,mimeType,parents,webViewLink,appProperties");

  const response = await fetch(url.toString(), {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name: input.name,
      mimeType: "application/vnd.google-apps.spreadsheet",
      parents: input.parentId ? [input.parentId] : undefined,
      appProperties: input.appProperties,
    }),
  });

  if (!response.ok) throw new Error(`drive_create_sheet_failed_${response.status}`);
  return (await response.json()) as DriveFile;
};

export const sheetsWriteValues = async (
  accessToken: string,
  spreadsheetId: string,
  input: { range: string; values: Array<Array<string | number | boolean | null>> },
) => {
  const url = new URL(`${SHEETS_BASE}/spreadsheets/${encodeURIComponent(spreadsheetId)}/values/${encodeURIComponent(input.range)}`);
  url.searchParams.set("valueInputOption", "USER_ENTERED");

  const response = await fetch(url.toString(), {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ values: input.values }),
  });

  if (!response.ok) throw new Error(`sheets_write_failed_${response.status}`);
  return (await response.json()) as unknown;
};
