import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";
import { env } from "./env";

const ensureDbDir = (dbPath: string) => {
  const dir = path.dirname(dbPath);
  if (dir && dir !== "." && !fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

ensureDbDir(env.dbPath);

export const db = new Database(env.dbPath);
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

export type CustomerRow = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  status: string;
  created_at: string;
  updated_at: string;
};

export type DocumentRow = {
  id: string;
  drive_file_id: string;
  customer_id: string | null;
  pending_customer_id: string | null;
  title: string;
  category: string | null;
  stage: string | null;
  mime_type: string;
  drive_modified_time: string | null;
  created_at: string;
  updated_at: string;
};

