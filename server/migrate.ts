import { db } from "./db";

export const migrate = () => {
  db.exec(`
    create table if not exists customers (
      id text primary key,
      name text not null,
      email text,
      phone text,
      status text not null default 'lead',
      created_at text not null,
      updated_at text not null
    );

    create table if not exists documents (
      id text primary key,
      drive_file_id text not null unique,
      customer_id text references customers(id) on delete set null,
      pending_customer_id text,
      title text not null,
      category text,
      stage text,
      mime_type text not null,
      drive_modified_time text,
      created_at text not null,
      updated_at text not null
    );

    create index if not exists idx_documents_customer_id on documents(customer_id);
    create index if not exists idx_documents_drive_modified_time on documents(drive_modified_time);
    create index if not exists idx_documents_title on documents(title);
  `);
};

