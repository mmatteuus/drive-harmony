import type { DriveFile } from "@/types/drive";

const getAccessToken = () => localStorage.getItem("google_access_token") ?? "";

const apiBaseUrl = (() => {
  const configured = String(import.meta.env.VITE_API_BASE_URL ?? "").trim();
  return configured || window.location.origin;
})();

const withApiBase = (input: RequestInfo | URL) => {
  if (typeof input === "string" && input.startsWith("/")) return new URL(input, apiBaseUrl);
  return input;
};

const jsonFetch = async <T>(input: RequestInfo | URL, init?: RequestInit) => {
  const response = await fetch(withApiBase(input), {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(body || `http_${response.status}`);
  }

  return (await response.json()) as T;
};

export type Customer = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  status: "lead" | "ativo" | "inativo";
  created_at: string;
  updated_at: string;
  documentCount?: number;
};

export type Document = {
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
  drive?: DriveFile;
};

export const api = {
  health: () => jsonFetch<{ ok: true }>("/api/health"),

  listCustomers: (search?: string) =>
    jsonFetch<{ customers: Customer[] }>(`/api/customers${search ? `?search=${encodeURIComponent(search)}` : ""}`),

  createCustomer: (input: { name: string; email?: string; phone?: string; status?: Customer["status"] }) =>
    jsonFetch<{ customer: Customer }>("/api/customers", { method: "POST", body: JSON.stringify(input) }),

  getCustomer: (id: string) => jsonFetch<{ customer: Customer }>(`/api/customers/${encodeURIComponent(id)}`),

  listCustomerDocuments: async (
    customerId: string,
    filters?: { search?: string; category?: string; stage?: string; dateFrom?: string; dateTo?: string },
  ) => {
    const token = getAccessToken();
    const url = new URL(`/api/customers/${encodeURIComponent(customerId)}/documents`, apiBaseUrl);
    if (filters?.search) url.searchParams.set("search", filters.search);
    if (filters?.category) url.searchParams.set("category", filters.category);
    if (filters?.stage) url.searchParams.set("stage", filters.stage);
    if (filters?.dateFrom) url.searchParams.set("dateFrom", filters.dateFrom);
    if (filters?.dateTo) url.searchParams.set("dateTo", filters.dateTo);

    return jsonFetch<{ customer: Customer; documents: Document[] }>(url.toString(), {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
  },

  linkDriveFile: async (input: { driveFileId: string; customerId: string; category?: string; stage?: string }) => {
    const token = getAccessToken();
    return jsonFetch<{ document: Document; driveFile: DriveFile }>("/api/documents/link-drive-file", {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: JSON.stringify(input),
    });
  },

  sync: async (rootFolderId?: string) => {
    const token = getAccessToken();
    const url = new URL("/api/documents/sync", apiBaseUrl);
    if (rootFolderId) url.searchParams.set("rootFolderId", rootFolderId);
    return jsonFetch<{ scanned: number; upserted: number; patched: number }>(url.toString(), {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
  },
};
