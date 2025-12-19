import { useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { api } from "@/lib/api";
import type { DriveFile } from "@/types/drive";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";

interface LinkToCustomerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  file: DriveFile;
  onLinked?: () => void;
}

export const LinkToCustomerDialog = ({ open, onOpenChange, file, onLinked }: LinkToCustomerDialogProps) => {
  const [customerId, setCustomerId] = useState<string>("");
  const [category, setCategory] = useState<string>(file.appProperties?.category ?? "");
  const [stage, setStage] = useState<string>(file.appProperties?.stage ?? "");

  const { data, isLoading } = useQuery({
    queryKey: ["customers"],
    queryFn: () => api.listCustomers(),
    enabled: open,
  });

  const customers = useMemo(() => data?.customers ?? [], [data]);

  const mutation = useMutation({
    mutationFn: () =>
      api.linkDriveFile({
        driveFileId: file.id,
        customerId,
        category: category || undefined,
        stage: stage || undefined,
      }),
    onSuccess: () => {
      toast.success("Arquivo vinculado ao cliente e metadados atualizados.");
      onOpenChange(false);
      onLinked?.();
    },
    onError: (error) => {
      console.error(error);
      toast.error("Não foi possível vincular o arquivo agora.");
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Vincular arquivo a cliente</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1">
            <p className="text-sm font-medium truncate">{file.name}</p>
            <p className="text-xs text-muted-foreground truncate">{file.mimeType}</p>
          </div>

          <div className="space-y-2">
            <Label>Cliente</Label>
            <Select value={customerId} onValueChange={setCustomerId} disabled={isLoading || customers.length === 0}>
              <SelectTrigger>
                <SelectValue placeholder={customers.length ? "Selecione um cliente" : "Nenhum cliente cadastrado"} />
              </SelectTrigger>
              <SelectContent>
                {customers.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name} {c.email ? `(${c.email})` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="category">Categoria (opcional)</Label>
              <Input
                id="category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="contrato, proposta..."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="stage">Etapa (opcional)</Label>
              <Input
                id="stage"
                value={stage}
                onChange={(e) => setStage(e.target.value)}
                placeholder="Descoberta, Proposta..."
              />
            </div>
          </div>

          <Button className="w-full" disabled={!customerId || mutation.isPending} onClick={() => mutation.mutate()}>
            {mutation.isPending ? "Vinculando..." : "Vincular"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

