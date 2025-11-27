import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface UploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentFolderId: string;
  onUploadComplete: () => void;
}

export const UploadDialog = ({ open, onOpenChange, currentFolderId, onUploadComplete }: UploadDialogProps) => {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [tags, setTags] = useState("");

  const resetState = () => {
    setFile(null);
    setTags("");
    setUploading(false);
  };

  const handleClose = (nextOpen: boolean) => {
    onOpenChange(nextOpen);
    if (!nextOpen) {
      resetState();
    }
  };

  const handleUpload = async () => {
    if (!file) {
      toast.error("Selecione um arquivo");
      return;
    }

    const token = localStorage.getItem("google_access_token");
    if (!token) {
      toast.error("Sua sessão expirou. Faça login novamente.");
      onOpenChange(false);
      return;
    }

    setUploading(true);

    try {
      const metadata = {
        name: file.name,
        parents: [currentFolderId],
        appProperties: tags ? { tags } : undefined,
      };

      const form = new FormData();
      form.append("metadata", new Blob([JSON.stringify(metadata)], { type: "application/json" }));
      form.append("file", file);

      const response = await fetch(
        "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,parents",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: form,
        },
      );

      if (response.ok) {
        toast.success("Arquivo enviado com sucesso!");
        onOpenChange(false);
        resetState();
        onUploadComplete();
      } else {
        toast.error("Erro ao enviar arquivo");
      }
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Erro ao enviar arquivo");
    } finally {
      setUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Upload de Arquivo</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="file">Arquivo</Label>
            <Input
              id="file"
              type="file"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="tags">Tags (opcional)</Label>
            <Input
              id="tags"
              placeholder="cliente, projeto, tipo..."
              value={tags}
              onChange={(e) => setTags(e.target.value)}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            O arquivo será enviado para a pasta atual do seu Drive e permanecerá armazenado apenas na sua conta Google.
          </p>
          <Button
            onClick={handleUpload}
            disabled={uploading || !file}
            className="w-full"
          >
            {uploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Enviando...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Enviar
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
