import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FolderPlus, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface CreateFolderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentFolderId: string;
  onCreated: () => void;
}

export const CreateFolderDialog = ({ open, onOpenChange, currentFolderId, onCreated }: CreateFolderDialogProps) => {
  const [folderName, setFolderName] = useState("");
  const [creating, setCreating] = useState(false);

  const handleClose = (nextOpen: boolean) => {
    onOpenChange(nextOpen);
    if (!nextOpen) {
      setFolderName("");
      setCreating(false);
    }
  };

  const handleCreate = async () => {
    if (!folderName.trim()) {
      toast.error("Informe um nome para a pasta");
      return;
    }

    const token = localStorage.getItem("google_access_token");
    if (!token) {
      toast.error("Sua sessão expirou. Faça login novamente.");
      onOpenChange(false);
      return;
    }

    setCreating(true);

    try {
      const response = await fetch("https://www.googleapis.com/drive/v3/files", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: folderName.trim(),
          mimeType: "application/vnd.google-apps.folder",
          parents: [currentFolderId],
        }),
      });

      if (response.ok) {
        toast.success("Pasta criada com sucesso");
        setFolderName("");
        onOpenChange(false);
        onCreated();
      } else {
        toast.error("Não foi possível criar a pasta");
      }
    } catch (error) {
      console.error("Create folder error:", error);
      toast.error("Não foi possível criar a pasta");
    } finally {
      setCreating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Criar pasta</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="folder-name">Nome da pasta</Label>
            <Input
              id="folder-name"
              placeholder="Ex.: Contratos, Clientes, Projetos"
              value={folderName}
              onChange={(e) => setFolderName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
            />
          </div>
          <Button onClick={handleCreate} disabled={creating || !folderName.trim()} className="w-full">
            {creating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Criando...
              </>
            ) : (
              <>
                <FolderPlus className="mr-2 h-4 w-4" />
                Criar pasta
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
