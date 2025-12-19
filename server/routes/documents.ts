import { Router } from "express";
import { z } from "zod";
import { randomUUID } from "node:crypto";
import { db, type CustomerRow, type DocumentRow } from "../db";
import { classify } from "../classify";
import {
  driveGetFile,
  driveListFilesInFolder,
  drivePatchAppProperties,
  requireAccessToken,
  type DriveFile,
} from "../googleDrive";
import { env } from "../env";

const nowIso = () => new Date().toISOString();

export const documentsRouter = Router();

documentsRouter.get("/", (req, res) => {
  const search = String(req.query.search ?? "").trim();
  const category = String(req.query.category ?? "").trim();
  const stage = String(req.query.stage ?? "").trim();
  const customerId = String(req.query.customerId ?? "").trim();
  const dateFrom = String(req.query.dateFrom ?? "").trim();
  const dateTo = String(req.query.dateTo ?? "").trim();

  const where: string[] = [];
  const params: Record<string, unknown> = {};

  if (search) {
    where.push("lower(title) like @search");
    params.search = `%${search.toLowerCase()}%`;
  }
  if (category) {
    where.push("category = @category");
    params.category = category;
  }
  if (stage) {
    where.push("stage = @stage");
    params.stage = stage;
  }
  if (customerId) {
    where.push("customer_id = @customerId");
    params.customerId = customerId;
  }
  if (dateFrom) {
    where.push("coalesce(drive_modified_time, updated_at) >= @dateFrom");
    params.dateFrom = new Date(dateFrom).toISOString();
  }
  if (dateTo) {
    const end = new Date(dateTo);
    end.setHours(23, 59, 59, 999);
    where.push("coalesce(drive_modified_time, updated_at) <= @dateTo");
    params.dateTo = end.toISOString();
  }

  const rows = db
    .prepare(
      `
      select * from documents
      ${where.length ? `where ${where.join(" and ")}` : ""}
      order by coalesce(drive_modified_time, updated_at) desc
      limit 500
    `,
    )
    .all(params) as DocumentRow[];

  res.json({ documents: rows });
});

documentsRouter.get("/customers/:id/documents", async (req, res) => {
  const customer = db.prepare("select * from customers where id = ?").get(req.params.id) as CustomerRow | undefined;
  if (!customer) return res.status(404).json({ error: "not_found" });

  const docs = db
    .prepare("select * from documents where customer_id = ? order by coalesce(drive_modified_time, updated_at) desc")
    .all(req.params.id) as DocumentRow[];

  const auth = req.header("authorization");
  if (!auth) return res.json({ customer, documents: docs });

  let accessToken: string;
  try {
    accessToken = requireAccessToken(auth);
  } catch {
    return res.status(401).json({ error: "missing_access_token" });
  }

  const driveFiles: DriveFile[] = [];
  for (const doc of docs) {
    try {
      driveFiles.push(await driveGetFile(accessToken, doc.drive_file_id));
    } catch {
      driveFiles.push({ id: doc.drive_file_id, name: doc.title, mimeType: doc.mime_type });
    }
  }

  const merged = docs.map((doc) => ({
    ...doc,
    drive: driveFiles.find((f) => f.id === doc.drive_file_id),
  }));

  res.json({ customer, documents: merged });
});

const linkSchema = z.object({
  driveFileId: z.string().min(1),
  customerId: z.string().min(1),
  category: z.string().optional(),
  stage: z.string().optional(),
});

documentsRouter.post("/link-drive-file", async (req, res) => {
  const parsed = linkSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const customer = db
    .prepare("select * from customers where id = ?")
    .get(parsed.data.customerId) as CustomerRow | undefined;
  if (!customer) return res.status(404).json({ error: "customer_not_found" });

  let accessToken: string;
  try {
    accessToken = requireAccessToken(req.header("authorization"));
  } catch {
    return res.status(401).json({ error: "missing_access_token" });
  }

  const driveFile = await driveGetFile(accessToken, parsed.data.driveFileId);
  const inferred = classify({ name: driveFile.name, mimeType: driveFile.mimeType, parents: driveFile.parents });

  const category = parsed.data.category ?? driveFile.appProperties?.category ?? inferred.category;
  const stage = parsed.data.stage ?? driveFile.appProperties?.stage ?? inferred.stage;

  const nextAppProps: Record<string, string> = {
    ...(driveFile.appProperties ?? {}),
    customerId: customer.id,
  };
  if (category) nextAppProps.category = category;
  if (stage) nextAppProps.stage = stage;

  await drivePatchAppProperties(accessToken, driveFile.id, nextAppProps);

  const existing = db
    .prepare("select * from documents where drive_file_id = ?")
    .get(driveFile.id) as DocumentRow | undefined;

  const timestamp = nowIso();
  const baseRow = {
    drive_file_id: driveFile.id,
    customer_id: customer.id,
    pending_customer_id: null,
    title: driveFile.name,
    category: category ?? null,
    stage: stage ?? null,
    mime_type: driveFile.mimeType,
    drive_modified_time: driveFile.modifiedTime ?? null,
    updated_at: timestamp,
  };

  if (existing) {
    db.prepare(
      `
      update documents
      set customer_id=@customer_id,
          pending_customer_id=@pending_customer_id,
          title=@title,
          category=@category,
          stage=@stage,
          mime_type=@mime_type,
          drive_modified_time=@drive_modified_time,
          updated_at=@updated_at
      where drive_file_id=@drive_file_id
    `,
    ).run(baseRow);
  } else {
    db.prepare(
      `
      insert into documents (
        id, drive_file_id, customer_id, pending_customer_id, title, category, stage, mime_type,
        drive_modified_time, created_at, updated_at
      ) values (
        @id, @drive_file_id, @customer_id, @pending_customer_id, @title, @category, @stage, @mime_type,
        @drive_modified_time, @created_at, @updated_at
      )
    `,
    ).run({ id: randomUUID(), created_at: timestamp, ...baseRow });
  }

  const document = db.prepare("select * from documents where drive_file_id = ?").get(driveFile.id) as DocumentRow;
  res.json({ document, driveFile: { ...driveFile, appProperties: nextAppProps } });
});

documentsRouter.post("/sync", async (req, res) => {
  let accessToken: string;
  try {
    accessToken = requireAccessToken(req.header("authorization"));
  } catch {
    return res.status(401).json({ error: "missing_access_token" });
  }

  const rootFolderId = String(req.query.rootFolderId ?? env.driveRootFolderId ?? "").trim();
  if (!rootFolderId) return res.status(400).json({ error: "missing_root_folder_id" });

  let pageToken: string | undefined;
  let scanned = 0;
  let upserted = 0;
  let patched = 0;

  do {
    const page = await driveListFilesInFolder(accessToken, rootFolderId, pageToken);
    pageToken = page.nextPageToken;
    const files = page.files ?? [];

    for (const file of files) {
      scanned += 1;
      const inferred = classify({ name: file.name, mimeType: file.mimeType, parents: file.parents });
      const appProps = file.appProperties ?? {};

      const nextAppProps: Record<string, string> = { ...appProps };
      let shouldPatch = false;

      if (!appProps.category && inferred.category) {
        nextAppProps.category = inferred.category;
        shouldPatch = true;
      }
      if (!appProps.stage && inferred.stage) {
        nextAppProps.stage = inferred.stage;
        shouldPatch = true;
      }

      if (shouldPatch) {
        try {
          await drivePatchAppProperties(accessToken, file.id, nextAppProps);
          patched += 1;
        } catch {
          // ignore patch errors per file
        }
      }

      const customerId = nextAppProps.customerId;
      const customer = customerId
        ? (db.prepare("select * from customers where id = ?").get(customerId) as CustomerRow | undefined)
        : undefined;

      const existing = db
        .prepare("select * from documents where drive_file_id = ?")
        .get(file.id) as DocumentRow | undefined;

      const timestamp = nowIso();
      const row = {
        drive_file_id: file.id,
        customer_id: customer ? customer.id : null,
        pending_customer_id: customer ? null : customerId ?? null,
        title: file.name,
        category: nextAppProps.category ?? null,
        stage: nextAppProps.stage ?? null,
        mime_type: file.mimeType,
        drive_modified_time: file.modifiedTime ?? null,
        updated_at: timestamp,
      };

      if (existing) {
        db.prepare(
          `
          update documents
          set customer_id=@customer_id,
              pending_customer_id=@pending_customer_id,
              title=@title,
              category=@category,
              stage=@stage,
              mime_type=@mime_type,
              drive_modified_time=@drive_modified_time,
              updated_at=@updated_at
          where drive_file_id=@drive_file_id
        `,
        ).run(row);
      } else {
        db.prepare(
          `
          insert into documents (
            id, drive_file_id, customer_id, pending_customer_id, title, category, stage, mime_type,
            drive_modified_time, created_at, updated_at
          ) values (
            @id, @drive_file_id, @customer_id, @pending_customer_id, @title, @category, @stage, @mime_type,
            @drive_modified_time, @created_at, @updated_at
          )
        `,
        ).run({ id: randomUUID(), created_at: timestamp, ...row });
      }

      upserted += 1;
    }
  } while (pageToken);

  res.json({ scanned, upserted, patched });
});
