import dotenv from "dotenv";

dotenv.config();

export const env = {
  port: parseInt(process.env.PORT ?? "8787", 10),
  dbPath: process.env.DB_PATH ?? "data/drive-harmony.sqlite",
  corsOrigin: process.env.CORS_ORIGIN ?? "http://localhost:8080",
  driveRootFolderId: process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID ?? "",
};

