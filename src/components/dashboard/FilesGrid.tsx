import { FileIcon, FolderIcon, RefreshCw, Upload } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { DriveFile } from "@/pages/Dashboard";
import { format } from "date-fns";

interface FilesGridProps {
  files: DriveFile[];
  loading: boolean;
  onFileClick: (file: DriveFile) => void;
  onRefresh: () => void;
  currentFolderId: string;
}

export const FilesGrid = ({ files, loading, onFileClick, onRefresh, currentFolderId }: FilesGridProps) => {
  const formatFileSize = (bytes?: string) => {
    if (!bytes) return "-";
    const size = parseInt(bytes);
    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {[...Array(8)].map((_, i) => (
          <Skeleton key={i} className="h-40 rounded-lg" />
        ))}
      </div>
    );
  }

  if (files.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <FolderIcon className="h-16 w-16 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">Nenhum arquivo encontrado</h3>
        <p className="text-sm text-muted-foreground mb-6">
          Esta pasta está vazia. Faça upload de arquivos para começar.
        </p>
        <Button>
          <Upload className="mr-2 h-4 w-4" />
          Upload de arquivo
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">
          {files.length} {files.length === 1 ? "item" : "itens"}
        </p>
        <Button variant="ghost" size="sm" onClick={onRefresh}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Atualizar
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {files.map((file) => {
          const isFolder = file.mimeType === "application/vnd.google-apps.folder";
          
          return (
            <Card
              key={file.id}
              className="p-4 hover:shadow-lg transition-all duration-200 cursor-pointer group"
              onClick={() => onFileClick(file)}
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  {isFolder ? (
                    <FolderIcon className="h-10 w-10 text-primary" />
                  ) : (
                    <FileIcon className="h-10 w-10 text-accent" />
                  )}
                </div>
                
                <div className="space-y-1">
                  <h3 className="font-medium line-clamp-2 group-hover:text-primary transition-colors">
                    {file.name}
                  </h3>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    {!isFolder && <span>{formatFileSize(file.size)}</span>}
                    {file.modifiedTime && (
                      <>
                        {!isFolder && <span>•</span>}
                        <span>{format(new Date(file.modifiedTime), "dd/MM/yyyy")}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
