import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Download, ExternalLink } from "lucide-react";
import type { DriveFile } from "@/types/drive";
import { format } from "date-fns";
import { toast } from "sonner";
import { useState } from "react";
import { LinkToCustomerDialog } from "@/components/crm/LinkToCustomerDialog";

interface FileDetailsDrawerProps {
  file: DriveFile | null;
  onClose: () => void;
  onLinked?: () => void;
}

export const FileDetailsDrawer = ({ file, onClose, onLinked }: FileDetailsDrawerProps) => {
  const [linkOpen, setLinkOpen] = useState(false);
  const handleDownload = async () => {
    if (!file) return;

    const token = localStorage.getItem("google_access_token");
    try {
      const response = await fetch(
        `https://www.googleapis.com/drive/v3/files/${file.id}?alt=media`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
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
    if (size < 1024 * 1024 * 1024) return `${(size / (1024 * 1024)).toFixed(1)} MB`;
    return `${(size / (1024 * 1024 * 1024)).toFixed(1)} GB`;
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
              <h3 className="font-semibold text-lg mb-4 break-words">{file.name}</h3>
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
                {file.owners?.length ? (
                  <div>
                    <p className="text-muted-foreground">Proprietário</p>
                    <p className="font-medium">{file.owners[0].displayName}</p>
                    <p className="text-xs text-muted-foreground">{file.owners[0].emailAddress}</p>
                  </div>
                ) : null}
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
              <Button variant="secondary" className="w-full" onClick={() => setLinkOpen(true)}>
                Vincular a cliente
              </Button>
            </div>
          </div>
        )}
      </SheetContent>
      {file && (
        <LinkToCustomerDialog
          open={linkOpen}
          onOpenChange={setLinkOpen}
          file={file}
          onLinked={() => {
            onLinked?.();
            onClose();
          }}
        />
      )}
    </Sheet>
  );
};
