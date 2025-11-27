import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Download, ExternalLink } from "lucide-react";
import type { DriveFile } from "@/pages/Dashboard";
import { format } from "date-fns";
import { toast } from "sonner";

interface FileDetailsDrawerProps {
  file: DriveFile | null;
  onClose: () => void;
}

export const FileDetailsDrawer = ({ file, onClose }: FileDetailsDrawerProps) => {
  const handleDownload = async () => {
    if (!file) return;

    const token = localStorage.getItem("google_access_token");
    try {
      const response = await fetch(
        `https://www.googleapis.com/drive/v3/files/${file.id}?alt=media`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = file.name;
        a.click();
        window.URL.revokeObjectURL(url);
        toast.success("Download iniciado");
      } else {
        toast.error("Erro ao baixar arquivo");
      }
    } catch (error) {
      console.error("Download error:", error);
      toast.error("Erro ao baixar arquivo");
    }
  };

  const formatFileSize = (bytes?: string) => {
    if (!bytes) return "-";
    const size = parseInt(bytes);
    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <Sheet open={!!file} onOpenChange={(open) => !open && onClose()}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Detalhes do Arquivo</SheetTitle>
        </SheetHeader>
        {file && (
          <div className="mt-6 space-y-6">
            <div>
              <h3 className="font-semibold text-lg mb-4">{file.name}</h3>
              <div className="space-y-3 text-sm">
                <div>
                  <p className="text-muted-foreground">Tipo</p>
                  <p className="font-medium">{file.mimeType}</p>
                </div>
                {file.size && (
                  <div>
                    <p className="text-muted-foreground">Tamanho</p>
                    <p className="font-medium">{formatFileSize(file.size)}</p>
                  </div>
                )}
                {file.modifiedTime && (
                  <div>
                    <p className="text-muted-foreground">Modificado em</p>
                    <p className="font-medium">
                      {format(new Date(file.modifiedTime), "dd/MM/yyyy 'às' HH:mm")}
                    </p>
                  </div>
                )}
                {file.appProperties && (
                  <div>
                    <p className="text-muted-foreground">Tags</p>
                    <p className="font-medium">{file.appProperties.tags || "-"}</p>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Button
                onClick={handleDownload}
                className="w-full"
              >
                <Download className="mr-2 h-4 w-4" />
                Baixar arquivo
              </Button>
              {file.webViewLink && (
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => window.open(file.webViewLink, "_blank")}
                >
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Abrir no Google Drive
                </Button>
              )}
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
};
