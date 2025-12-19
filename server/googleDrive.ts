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

