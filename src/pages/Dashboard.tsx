import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { FilesGrid } from "@/components/dashboard/FilesGrid";
import { FileDetailsDrawer } from "@/components/dashboard/FileDetailsDrawer";
import { SearchFilters, type DriveFilters } from "@/components/dashboard/SearchFilters";
import { UploadDialog } from "@/components/dashboard/UploadDialog";
import { CreateFolderDialog } from "@/components/dashboard/CreateFolderDialog";
import { AccountDrawer } from "@/components/dashboard/AccountDrawer";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  modifiedTime: string;
  size?: string;
  parents?: string[];
  webViewLink?: string;
  appProperties?: Record<string, string>;
  iconLink?: string;
  owners?: Array<{ displayName?: string; emailAddress?: string }>;
}

interface UserInfo {
  name?: string;
  email?: string;
  picture?: string;
}

interface AccountInfo {
  storageQuota?: {
    limit?: string;
    usage?: string;
    usageInDrive?: string;
    usageInDriveTrash?: string;
  };
  user?: {
    displayName?: string;
    emailAddress?: string;
    photoLink?: string;
  };
}

const DEFAULT_FILTERS: DriveFilters = {
  query: "",
  mimeType: "all",
  dateFrom: "",
  dateTo: "",
  tags: "",
};

const FILTERS_STORAGE_KEY = "drive_harmony_filters";

const loadStoredFilters = (): DriveFilters => {
  if (typeof window === "undefined") return DEFAULT_FILTERS;

  const storedFilters = localStorage.getItem(FILTERS_STORAGE_KEY);
  if (!storedFilters) return DEFAULT_FILTERS;

  try {
    const parsed = JSON.parse(storedFilters) as Partial<DriveFilters>;
    return { ...DEFAULT_FILTERS, ...parsed };
  } catch (error) {
    console.error("Error parsing stored filters:", error);
    return DEFAULT_FILTERS;
  }
};

const Dashboard = () => {
  const navigate = useNavigate();
  const [files, setFiles] = useState<DriveFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [accountInfo, setAccountInfo] = useState<AccountInfo | null>(null);
  const [selectedFile, setSelectedFile] = useState<DriveFile | null>(null);
  const [currentFolderId, setCurrentFolderId] = useState<string>("root");
  const [breadcrumb, setBreadcrumb] = useState<Array<{ id: string; name: string }>>([
    { id: "root", name: "Meu Drive" },
  ]);
  const [filters, setFilters] = useState<DriveFilters>(() => loadStoredFilters());
  const [nextPageToken, setNextPageToken] = useState<string | null>(null);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isCreateFolderOpen, setIsCreateFolderOpen] = useState(false);
  const [isAccountOpen, setIsAccountOpen] = useState(false);

  const escapeQueryValue = (value: string) => value.replace(/'/g, "\\'");

  const logoutAndRedirect = useCallback(() => {
    localStorage.removeItem("google_access_token");
    localStorage.removeItem(FILTERS_STORAGE_KEY);
    setFiles([]);
    setNextPageToken(null);
    setSelectedFile(null);
    setUserInfo(null);
    toast.error("Sessão expirada. Faça login novamente.");
    navigate("/");
  }, [navigate]);

  const buildQuery = useCallback(
    (activeFilters: DriveFilters) => {
      let query = `'${currentFolderId}' in parents and trashed = false`;

      if (activeFilters.query.trim()) {
        query += ` and name contains '${escapeQueryValue(activeFilters.query.trim())}'`;
      }

      if (activeFilters.mimeType && activeFilters.mimeType !== "all") {
        if (activeFilters.mimeType === "folder") {
          query += " and mimeType = 'application/vnd.google-apps.folder'";
        } else if (activeFilters.mimeType === "image") {
          query += " and mimeType contains 'image/'";
        } else {
          query += ` and mimeType = '${escapeQueryValue(activeFilters.mimeType)}'`;
        }
      }

      if (activeFilters.tags?.trim()) {
        query += ` and appProperties has { key='tags' and value='${escapeQueryValue(activeFilters.tags.trim())}' }`;
      }

      if (activeFilters.dateFrom) {
        const from = new Date(activeFilters.dateFrom);
        if (!Number.isNaN(from.getTime())) {
          query += ` and modifiedTime >= '${from.toISOString()}'`;
        }
      }

      if (activeFilters.dateTo) {
        const to = new Date(activeFilters.dateTo);
        if (!Number.isNaN(to.getTime())) {
          to.setHours(23, 59, 59, 999);
          query += ` and modifiedTime <= '${to.toISOString()}'`;
        }
      }

      return query;
    },
    [currentFolderId],
  );

  const fetchUserInfo = useCallback(async () => {
    const token = localStorage.getItem("google_access_token");
    if (!token) return;

    try {
      const response = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) logoutAndRedirect();
        return;
      }

      const data = await response.json();
      setUserInfo({ name: data.name, email: data.email, picture: data.picture });
    } catch (error) {
      console.error("Error fetching user info:", error);
    }
  }, [logoutAndRedirect]);

  const fetchAccountInfo = useCallback(async () => {
    const token = localStorage.getItem("google_access_token");
    if (!token) return;

    try {
      const response = await fetch("https://www.googleapis.com/drive/v3/about?fields=storageQuota,user", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) logoutAndRedirect();
        return;
      }

      const data = await response.json();
      setAccountInfo(data);
    } catch (error) {
      console.error("Error fetching account info:", error);
    }
  }, [logoutAndRedirect]);

  const fetchFiles = useCallback(
    async (options?: { filters?: DriveFilters; pageToken?: string; append?: boolean }) => {
      const token = localStorage.getItem("google_access_token");
      if (!token) {
        navigate("/");
        return;
      }

      const activeFilters = options?.filters ?? filters;
      const query = buildQuery(activeFilters);

      if (options?.append) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }

      try {
        const url = new URL("https://www.googleapis.com/drive/v3/files");
        url.searchParams.set("q", query);
        url.searchParams.set(
          "fields",
          "nextPageToken,files(id,name,mimeType,modifiedTime,size,parents,webViewLink,iconLink,appProperties,owners(displayName,emailAddress))",
        );
        url.searchParams.set("pageSize", "50");
        if (options?.pageToken) {
          url.searchParams.set("pageToken", options.pageToken);
        }

        const response = await fetch(url.toString(), {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) {
          if (response.status === 401 || response.status === 403) {
            logoutAndRedirect();
          } else {
            toast.error("Não foi possível carregar seus arquivos agora.");
          }
          return;
        }

        const data = await response.json();
        setFiles((prev) => (options?.append ? [...prev, ...(data.files || [])] : data.files || []));
        setNextPageToken(data.nextPageToken || null);
      } catch (error) {
        console.error("Error fetching files:", error);
        toast.error("Não foi possível carregar seus arquivos agora.");
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [buildQuery, filters, navigate, logoutAndRedirect],
  );

  useEffect(() => {
    const token = localStorage.getItem("google_access_token");
    if (!token) {
      navigate("/");
      return;
    }

    fetchUserInfo();
    fetchAccountInfo();
  }, [fetchAccountInfo, fetchUserInfo, navigate]);

  useEffect(() => {
    localStorage.setItem(FILTERS_STORAGE_KEY, JSON.stringify(filters));
  }, [filters]);

  useEffect(() => {
    fetchFiles({ filters });
  }, [currentFolderId, filters, fetchFiles]);

  const handleLogout = () => {
    localStorage.removeItem("google_access_token");
    localStorage.removeItem("google_id_token");
    localStorage.removeItem(FILTERS_STORAGE_KEY);
    navigate("/");
    toast.success("Sessão encerrada.");
  };

  const handleFolderClick = (file: DriveFile) => {
    if (file.mimeType === "application/vnd.google-apps.folder") {
      setCurrentFolderId(file.id);
      setBreadcrumb((prev) => [...prev, { id: file.id, name: file.name }]);
    }
  };

  const handleBreadcrumbClick = (index: number) => {
    const newBreadcrumb = breadcrumb.slice(0, index + 1);
    setBreadcrumb(newBreadcrumb);
    setCurrentFolderId(newBreadcrumb[newBreadcrumb.length - 1].id);
  };

  const handleFileClick = (file: DriveFile) => {
    if (file.mimeType === "application/vnd.google-apps.folder") {
      handleFolderClick(file);
    } else {
      setSelectedFile(file);
    }
  };

  const handleSearch = (newFilters: DriveFilters) => {
    setFilters(newFilters);
  };

  const handleResetFilters = () => {
    setFilters(DEFAULT_FILTERS);
  };

  const handleLoadMore = () => {
    if (nextPageToken) {
      fetchFiles({ filters, pageToken: nextPageToken, append: true });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader userInfo={userInfo} onLogout={handleLogout} onOpenAccount={() => setIsAccountOpen(true)} />

      <main className="container mx-auto px-4 py-6 space-y-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <SearchFilters filters={filters} onSearch={handleSearch} onReset={handleResetFilters} onChange={setFilters} />

          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => setIsCreateFolderOpen(true)}>
              Criar pasta
            </Button>
            <Button onClick={() => setIsUploadOpen(true)}>Upload de arquivo</Button>
          </div>
        </div>

        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          {breadcrumb.map((item, index) => (
            <div key={item.id} className="flex items-center gap-2">
              <button
                onClick={() => handleBreadcrumbClick(index)}
                className="hover:text-foreground transition-colors"
              >
                {item.name}
              </button>
              {index < breadcrumb.length - 1 && <span>/</span>}
            </div>
          ))}
        </div>

        <FilesGrid
          files={files}
          loading={loading}
          loadingMore={loadingMore}
          onFileClick={handleFileClick}
          onRefresh={() => fetchFiles({ filters })}
          onLoadMore={nextPageToken ? handleLoadMore : undefined}
          canLoadMore={!!nextPageToken}
          onUploadClick={() => setIsUploadOpen(true)}
        />
      </main>

      <FileDetailsDrawer file={selectedFile} onClose={() => setSelectedFile(null)} />

      <UploadDialog
        open={isUploadOpen}
        onOpenChange={setIsUploadOpen}
        currentFolderId={currentFolderId}
        onUploadComplete={() => fetchFiles({ filters })}
      />

      <CreateFolderDialog
        open={isCreateFolderOpen}
        onOpenChange={setIsCreateFolderOpen}
        currentFolderId={currentFolderId}
        onCreated={() => fetchFiles({ filters })}
      />

      <AccountDrawer
        open={isAccountOpen}
        onOpenChange={setIsAccountOpen}
        accountInfo={accountInfo}
        userInfo={userInfo}
        onLogout={handleLogout}
      />
    </div>
  );
};

export default Dashboard;
