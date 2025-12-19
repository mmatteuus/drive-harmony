import { FileIcon, FolderIcon, Loader2, RefreshCw, Upload } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { DriveFile } from "@/pages/Dashboard";
import { format } from "date-fns";

interface FilesGridProps {
  files: DriveFile[];
  loading: boolean;
  loadingMore?: boolean;
  onFileClick: (file: DriveFile) => void;
  onRefresh: () => void;
  onLoadMore?: () => void;
  canLoadMore?: boolean;
  onUploadClick?: () => void;
}

export const FilesGrid = ({
  files,
  loading,
  loadingMore,
  onFileClick,
  onRefresh,
  onLoadMore,
  canLoadMore,
  onUploadClick,
}: FilesGridProps) => {
  const formatFileSize = (bytes?: string) => {
    if (!bytes) return "-";
    const size = parseInt(bytes);
    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
    if (size < 1024 * 1024 * 1024) return `${(size / (1024 * 1024)).toFixed(1)} MB`;
    return `${(size / (1024 * 1024 * 1024)).toFixed(1)} GB`;
  };

  const formatDate = (value: string) => format(new Date(value), "dd/MM/yyyy");

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
      <div className="flex flex-col items-center justify-center py-20 text-center border border-dashed rounded-2xl bg-muted/40">
        <FolderIcon className="h-16 w-16 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">Nenhum arquivo encontrado</h3>
        <p className="text-sm text-muted-foreground mb-6">
          Esta pasta está vazia. Faça upload ou crie uma pasta para começar.
        </p>
        <div className="flex gap-2">
          <Button onClick={onUploadClick}>
            <Upload className="mr-2 h-4 w-4" />
            Upload de arquivo
          </Button>
          <Button variant="ghost" onClick={onRefresh}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Atualizar
          </Button>
        </div>
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
                <div className="h-24 w-full rounded-xl overflow-hidden flex items-center justify-center bg-slate-100">
                  {isFolder ? (
                    <FolderIcon className="h-12 w-12 text-primary" />
                  ) : file.hasThumbnail && file.thumbnailLink ? (
                    <img
                      src={file.thumbnailLink}
                      alt={file.name}
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                  ) : file.iconLink ? (
                    <img src={file.iconLink} alt={file.name} className="h-10 w-10 opacity-70" loading="lazy" />
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
                        <span>{formatDate(file.modifiedTime)}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {canLoadMore && (
        <div className="flex justify-center">
          <Button variant="outline" onClick={onLoadMore} disabled={loadingMore} className="min-w-[200px]">
            {loadingMore ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Carregando...
              </>
            ) : (
              "Carregar mais"
            )}
          </Button>
        </div>
      )}
    </div>
  );
};
