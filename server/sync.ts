import { env } from "./env";
import { migrate } from "./migrate";

// Lightweight entrypoint so you can run: GOOGLE_ACCESS_TOKEN=... npm run sync
migrate();

const accessToken = process.env.GOOGLE_ACCESS_TOKEN ?? "";
if (!accessToken) {
  console.error("Missing GOOGLE_ACCESS_TOKEN env var.");
  process.exit(1);
}

const rootFolderId = env.driveRootFolderId;
if (!rootFolderId) {
  console.error("Missing GOOGLE_DRIVE_ROOT_FOLDER_ID env var.");
  process.exit(1);
}

const response = await fetch(
  `http://localhost:${env.port}/api/documents/sync?rootFolderId=${encodeURIComponent(rootFolderId)}`,
  {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}` },
  },
);

const text = await response.text();
console.log(text);
