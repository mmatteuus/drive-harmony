import { ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { DriveFile } from "@/types/drive";

interface FilePreviewModalProps {
  file: DriveFile;
  onClose: () => void;
  onOpenDetails?: () => void;
}

export const FilePreviewModal = ({ file, onClose, onOpenDetails }: FilePreviewModalProps) => {
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 px-4">
      <div className="bg-white rounded-2xl shadow-xl w-[90vw] max-w-6xl h-[80vh] overflow-hidden flex flex-col">
        <header className="flex items-center justify-between px-4 py-3 border-b gap-2">
          <div className="min-w-0">
            <p className="font-semibold truncate">{file.name}</p>
            <p className="text-xs text-muted-foreground truncate">{file.mimeType}</p>
          </div>
          <div className="flex items-center gap-2">
            {onOpenDetails && (
              <Button variant="outline" size="sm" onClick={onOpenDetails}>
                Detalhes
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => window.open(file.webViewLink ?? `https://drive.google.com/file/d/${file.id}/preview`, "_blank")}
            >
              <ExternalLink className="mr-2 h-4 w-4" />
              Abrir no Drive
            </Button>
            <Button size="sm" onClick={onClose}>
              Fechar
            </Button>
          </div>
        </header>
        <iframe
          src={file.webViewLink ?? `https://drive.google.com/file/d/${file.id}/preview`}
          className="flex-1 w-full border-0 bg-slate-50"
          allow="autoplay; fullscreen"
          title={file.name}
        />
      </div>
    </div>
  );
};

