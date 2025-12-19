import { useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FileIcon, FolderIcon } from "lucide-react";
import type { DriveFile } from "@/types/drive";
import { FilePreviewModal } from "@/components/crm/FilePreviewModal";
import { toast } from "sonner";

export default function CrmCustomerDetail() {
  const params = useParams();
  const customerId = params.id ?? "";
  const [previewFile, setPreviewFile] = useState<DriveFile | null>(null);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [stage, setStage] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const query = useQuery({
    queryKey: ["customer", customerId, "documents", search, category, stage, dateFrom, dateTo],
    queryFn: () => api.listCustomerDocuments(customerId, { search, category, stage, dateFrom, dateTo }),
    enabled: Boolean(customerId),
  });

  const customer = query.data?.customer;
  const documents = useMemo(() => query.data?.documents ?? [], [query.data]);

  const handleSync = async () => {
    try {
      await api.sync();
      await query.refetch();
      toast.success("SincronizaÃ§Ã£o concluÃ­da.");
    } catch (error) {
      console.error(error);
      toast.error("Falha ao sincronizar.");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 pt-16 pb-14 sm:pt-6 sm:pb-6 space-y-6">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="space-y-1">
<h1 className="text-2xl font-bold">{customer?.name ?? "Cliente"}</h1>
            <p className="text-sm text-muted-foreground">{customer?.email ?? "-"}</p>
          </div>
          <Button variant="outline" onClick={handleSync} className="w-full sm:w-auto">
            Sincronizar
          </Button>
        </div>

        <Card className="p-4">
          <h2 className="font-semibold mb-3">Documentos</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 mb-4">
            <div className="lg:col-span-2 space-y-1">
              <Label htmlFor="search">Busca</Label>
              <Input id="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="nome do arquivo" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="category">Categoria</Label>
              <Input id="category" value={category} onChange={(e) => setCategory(e.target.value)} placeholder="contrato..." />
            </div>
            <div className="space-y-1">
              <Label htmlFor="stage">Etapa</Label>
              <Input id="stage" value={stage} onChange={(e) => setStage(e.target.value)} placeholder="Proposta..." />
            </div>
            <div className="space-y-1">
              <Label htmlFor="dateFrom">De</Label>
              <Input id="dateFrom" type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="dateTo">AtÃ©</Label>
              <Input id="dateTo" type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {documents.map((doc) => {
              const file = doc.drive ?? ({ id: doc.drive_file_id, name: doc.title, mimeType: doc.mime_type } as DriveFile);
              const isFolder = file.mimeType === "application/vnd.google-apps.folder";

              return (
                <Card key={doc.id} className="p-4 space-y-3">
                  <button
                    className="h-24 w-full rounded-xl overflow-hidden flex items-center justify-center bg-slate-100"
                    onClick={() => !isFolder && setPreviewFile(file)}
                  >
                    {isFolder ? (
                      <FolderIcon className="h-12 w-12 text-primary" />
                    ) : file.hasThumbnail && file.thumbnailLink ? (
                      <img src={file.thumbnailLink} alt={file.name} className="h-full w-full object-cover" loading="lazy" />
                    ) : file.iconLink ? (
                      <img src={file.iconLink} alt={file.name} className="h-10 w-10 opacity-70" loading="lazy" />
                    ) : (
                      <FileIcon className="h-10 w-10 text-accent" />
                    )}
                  </button>

                  <div className="space-y-1">
                    <p className="font-medium line-clamp-2">{doc.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {doc.category ?? "-"} {doc.stage ? `• ${doc.stage}` : ""}
                    </p>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full sm:flex-1"
                      onClick={() =>
                        window.open(file.webViewLink ?? `https://drive.google.com/file/d/${file.id}/preview`, "_blank")
                      }
                    >
                      Abrir no Drive
                    </Button>
                    <Button size="sm" className="w-full sm:flex-1" onClick={() => setPreviewFile(file)} disabled={isFolder}>
                      Preview
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        </Card>
      </main>

      {previewFile && <FilePreviewModal file={previewFile} onClose={() => setPreviewFile(null)} />}
    </div>
  );
}



