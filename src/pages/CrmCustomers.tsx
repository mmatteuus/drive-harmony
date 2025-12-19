import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export default function CrmCustomers() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  const customersQuery = useQuery({
    queryKey: ["customers", search],
    queryFn: () => api.listCustomers(search),
  });

  const customers = useMemo(() => customersQuery.data?.customers ?? [], [customersQuery.data]);

  const createMutation = useMutation({
    mutationFn: () => api.createCustomer({ name, email, phone }),
    onSuccess: async () => {
      toast.success("Cliente criado.");
      setName("");
      setEmail("");
      setPhone("");
      await queryClient.invalidateQueries({ queryKey: ["customers"] });
    },
    onError: (error) => {
      console.error(error);
      const message = error instanceof Error ? error.message : "";
      if (message.includes("missing_access_token")) return toast.error("Faça login com Google para criar clientes.");
      if (message.includes("missing_root_folder_id"))
        return toast.error("Backend sem GOOGLE_DRIVE_ROOT_FOLDER_ID configurado.");
      if (message.includes("404")) return toast.error("Backend não encontrado (404)." );
      toast.error("Não foi possível criar o cliente.");
    },
  });

  const handleSync = async () => {
    try {
      await api.sync();
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
          <div>
            <h1 className="text-2xl font-bold">CRM</h1>
            <p className="text-sm text-muted-foreground">Clientes e documentos vinculados ao Drive.</p>
          </div>
          <Button variant="outline" onClick={handleSync} className="w-full sm:w-auto">
            Sincronizar Drive
          </Button>
        </div>

        <Card className="p-4 space-y-3">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex-1 min-w-[240px]">
              <Label htmlFor="search">Buscar clientes</Label>
              <Input
                id="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="nome ou e-mail"
              />
            </div>
          </div>
        </Card>

        <Card className="p-4 space-y-3">
          <h2 className="font-semibold">Novo cliente</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1">
              <Label htmlFor="name">Nome</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="email">E-mail</Label>
              <Input id="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="phone">Telefone</Label>
              <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
          </div>
          <Button disabled={!name.trim() || createMutation.isPending} onClick={() => createMutation.mutate()} className="w-full sm:w-auto">
            {createMutation.isPending ? "Criando..." : "Criar cliente"}
          </Button>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {(customersQuery.isLoading
            ? Array.from({ length: 6 }).map((_, i) => ({
                id: String(i),
                name: "Carregando...",
                email: null,
                documentCount: 0,
              }))
            : customers
          ).map((customer) => (
            <Card key={customer.id} className="p-4 space-y-2">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-semibold truncate">{customer.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{customer.email ?? "-"}</p>
                </div>
                <span className="text-xs text-muted-foreground">{customer.documentCount ?? 0} docs</span>
              </div>
              <Button asChild variant="outline" size="sm" className="w-full">
                <Link to={`/crm/customers/${customer.id}`}>Abrir</Link>
              </Button>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
}



