import { Router } from "express";
import { z } from "zod";
import { randomUUID } from "node:crypto";
import { db, type CustomerRow, type DocumentRow } from "../db";
import {
  driveCreateFolder,
  driveCreateSpreadsheet,
  driveGetFile,
  requireAccessToken,
  sheetsWriteValues,
  type DriveFile,
} from "../googleDrive";
import { env } from "../env";

const nowIso = () => new Date().toISOString();

const customerCreateSchema = z.object({
  name: z.string().min(1),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional().or(z.literal("")),
  status: z.enum(["lead", "ativo", "inativo"]).optional(),
});

const customerUpdateSchema = customerCreateSchema.partial();

export const customersRouter = Router();

customersRouter.get("/", (req, res) => {
  const search = String(req.query.search ?? "").trim().toLowerCase();
  const hasSearch = Boolean(search);

  const rows = db
    .prepare(
      `
      select
        c.*,
        (select count(*) from documents d where d.customer_id = c.id) as documentCount
      from customers c
      ${hasSearch ? "where lower(c.name) like @q or lower(coalesce(c.email,'')) like @q" : ""}
      order by c.updated_at desc
    `,
    )
    .all(hasSearch ? { q: `%${search}%` } : {}) as Array<CustomerRow & { documentCount: number }>;

  res.json({ customers: rows });
});

customersRouter.post("/", async (req, res) => {
  const parsed = customerCreateSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  let accessToken: string;
  try {
    accessToken = requireAccessToken(req.header("authorization"));
  } catch {
    return res.status(401).json({ error: "missing_access_token" });
  }

  const rootFolderId = String(env.driveRootFolderId ?? "").trim();
  if (!rootFolderId) return res.status(400).json({ error: "missing_root_folder_id" });

  const id = randomUUID();
  const timestamp = nowIso();
  const email = parsed.data.email?.trim() ? parsed.data.email.trim() : null;
  const phone = parsed.data.phone?.trim() ? parsed.data.phone.trim() : null;
  const status = parsed.data.status ?? "lead";
  const customerName = parsed.data.name.trim();

  const folder = await driveCreateFolder(accessToken, {
    name: customerName,
    parentId: rootFolderId,
    appProperties: { customerId: id, kind: "crm_customer" },
  });

  const sheet = await driveCreateSpreadsheet(accessToken, {
    name: "Cliente.xlsx",
    parentId: folder.id,
    appProperties: { customerId: id, kind: "crm_customer_sheet" },
  });

  try {
    await sheetsWriteValues(accessToken, sheet.id, {
      range: "A1:G2",
      values: [
        ["ID", "Nome", "E-mail", "Telefone", "Status", "Criado em", "Atualizado em"],
        [id, customerName, email ?? "", phone ?? "", status, timestamp, timestamp],
      ],
    });
  } catch {
    // If Sheets scope is missing, we still keep folder + sheet created.
  }

  db.prepare(
    `
    insert into customers (id, name, email, phone, status, drive_folder_id, sheet_file_id, created_at, updated_at)
    values (@id, @name, @email, @phone, @status, @drive_folder_id, @sheet_file_id, @created_at, @updated_at)
  `,
  ).run({
    id,
    name: customerName,
    email,
    phone,
    status,
    drive_folder_id: folder.id,
    sheet_file_id: sheet.id,
    created_at: timestamp,
    updated_at: timestamp,
  });

  const customer = db.prepare("select * from customers where id = ?").get(id) as CustomerRow;
  res.status(201).json({ customer });
});

customersRouter.get("/:id", (req, res) => {
  const row = db.prepare("select * from customers where id = ?").get(req.params.id) as CustomerRow | undefined;
  if (!row) return res.status(404).json({ error: "not_found" });
  res.json({ customer: row });
});

customersRouter.get("/:id/documents", async (req, res) => {
  const customer = db.prepare("select * from customers where id = ?").get(req.params.id) as CustomerRow | undefined;
  if (!customer) return res.status(404).json({ error: "not_found" });

  const search = String(req.query.search ?? "").trim();
  const category = String(req.query.category ?? "").trim();
  const stage = String(req.query.stage ?? "").trim();
  const dateFrom = String(req.query.dateFrom ?? "").trim();
  const dateTo = String(req.query.dateTo ?? "").trim();

  const where: string[] = ["customer_id = @customerId"];
  const params: Record<string, unknown> = { customerId: customer.id };

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

  const docs = db
    .prepare(
      `
      select * from documents
      where ${where.join(" and ")}
      order by coalesce(drive_modified_time, updated_at) desc
    `,
    )
    .all(params) as DocumentRow[];

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

customersRouter.patch("/:id", (req, res) => {
  const parsed = customerUpdateSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const existing = db.prepare("select * from customers where id = ?").get(req.params.id) as CustomerRow | undefined;
  if (!existing) return res.status(404).json({ error: "not_found" });

  const next = {
    name: parsed.data.name?.trim() ?? existing.name,
    email: parsed.data.email === "" ? null : parsed.data.email?.trim() ?? existing.email,
    phone: parsed.data.phone === "" ? null : parsed.data.phone?.trim() ?? existing.phone,
    status: parsed.data.status ?? existing.status,
    updated_at: nowIso(),
  };

  db.prepare(
    `
    update customers
    set name = @name, email = @email, phone = @phone, status = @status, updated_at = @updated_at
    where id = @id
  `,
  ).run({ id: existing.id, ...next });

  const customer = db.prepare("select * from customers where id = ?").get(existing.id) as CustomerRow;
  res.json({ customer });
});
