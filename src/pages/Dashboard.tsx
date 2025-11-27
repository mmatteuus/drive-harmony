import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { FilesGrid } from "@/components/dashboard/FilesGrid";
import { SearchFilters } from "@/components/dashboard/SearchFilters";
import { UploadDialog } from "@/components/dashboard/UploadDialog";
import { FileDetailsDrawer } from "@/components/dashboard/FileDetailsDrawer";
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
}

const Dashboard = () => {
  const navigate = useNavigate();
  const [files, setFiles] = useState<DriveFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [userInfo, setUserInfo] = useState<any>(null);
  const [selectedFile, setSelectedFile] = useState<DriveFile | null>(null);
  const [currentFolderId, setCurrentFolderId] = useState<string>("root");
  const [breadcrumb, setBreadcrumb] = useState<Array<{ id: string; name: string }>>([
    { id: "root", name: "Meu Drive" }
  ]);

  useEffect(() => {
    const token = localStorage.getItem("google_access_token");
    if (!token) {
      navigate("/");
      return;
    }
    
    fetchUserInfo();
    fetchFiles();
  }, [navigate, currentFolderId]);

  const fetchUserInfo = async () => {
    const token = localStorage.getItem("google_access_token");
    try {
      const response = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      setUserInfo(data);
    } catch (error) {
      console.error("Error fetching user info:", error);
    }
  };

  const fetchFiles = async (searchQuery?: string, filters?: any) => {
    const token = localStorage.getItem("google_access_token");
    setLoading(true);
    
    try {
      let query = `'${currentFolderId}' in parents and trashed = false`;
      
      if (searchQuery) {
        query += ` and name contains '${searchQuery}'`;
      }
      
      if (filters?.mimeType) {
        query += ` and mimeType = '${filters.mimeType}'`;
      }
      
      const response = await fetch(
        `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&fields=files(id,name,mimeType,modifiedTime,size,parents,webViewLink,iconLink,appProperties)&pageSize=100`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      
      if (response.status === 401) {
        toast.error("Session expired. Please login again.");
        localStorage.removeItem("google_access_token");
        navigate("/");
        return;
      }
      
      const data = await response.json();
      setFiles(data.files || []);
    } catch (error) {
      console.error("Error fetching files:", error);
      toast.error("Failed to load files");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("google_access_token");
    localStorage.removeItem("google_id_token");
    navigate("/");
    toast.success("Logged out successfully");
  };

  const handleFolderClick = (file: DriveFile) => {
    if (file.mimeType === "application/vnd.google-apps.folder") {
      setCurrentFolderId(file.id);
      setBreadcrumb([...breadcrumb, { id: file.id, name: file.name }]);
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

  const handleSearch = (query: string, filters: any) => {
    fetchFiles(query, filters);
  };

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader 
        userInfo={userInfo} 
        onLogout={handleLogout}
      />
      
      <main className="container mx-auto px-4 py-6 space-y-6">
        <SearchFilters onSearch={handleSearch} />
        
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
          onFileClick={handleFileClick}
          onRefresh={() => fetchFiles()}
          currentFolderId={currentFolderId}
        />
      </main>

      <FileDetailsDrawer 
        file={selectedFile}
        onClose={() => setSelectedFile(null)}
      />
      
      <UploadDialog 
        currentFolderId={currentFolderId}
        onUploadComplete={() => fetchFiles()}
      />
    </div>
  );
};

export default Dashboard;
