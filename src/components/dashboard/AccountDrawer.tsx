import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LogOut } from "lucide-react";

interface AccountDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  accountInfo: any;
  userInfo: any;
  onLogout: () => void;
}

const formatBytes = (value?: string) => {
  if (!value) return "-";
  const bytes = Number(value);
  if (Number.isNaN(bytes) || bytes === 0) return "-";
  const units = ["B", "KB", "MB", "GB", "TB"];
  let index = 0;
  let size = bytes;
  while (size >= 1024 && index < units.length - 1) {
    size /= 1024;
    index++;
  }
  return `${size.toFixed(1)} ${units[index]}`;
};

export const AccountDrawer = ({ open, onOpenChange, accountInfo, userInfo, onLogout }: AccountDrawerProps) => {
  const quota = accountInfo?.storageQuota;
  const limit = Number(quota?.limit || 0);
  const usage = Number(quota?.usage || 0);
  const usagePercent = limit > 0 ? Math.min(100, Math.round((usage / limit) * 100)) : undefined;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>Configurações da conta</SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          <div className="flex items-center gap-3">
            <Avatar className="h-12 w-12">
              <AvatarImage src={userInfo?.picture || accountInfo?.user?.photoLink} alt={userInfo?.name} />
              <AvatarFallback>{userInfo?.name?.[0] || "U"}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-semibold">{userInfo?.name || accountInfo?.user?.displayName || "Conta"}</p>
              <p className="text-sm text-muted-foreground">{userInfo?.email || accountInfo?.user?.emailAddress}</p>
            </div>
          </div>

          <div className="space-y-2 rounded-xl border p-4 bg-muted/60">
            <p className="text-sm font-medium">Uso do Google Drive</p>
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>Armazenamento</span>
              <span>
                {formatBytes(quota?.usage)}
                {limit ? ` de ${formatBytes(quota.limit)}` : ""}
              </span>
            </div>
            {usagePercent !== undefined && (
              <>
                <Progress value={usagePercent} className="h-2" />
                <p className="text-xs text-muted-foreground">{usagePercent}% utilizado</p>
              </>
            )}
          </div>

          <div className="space-y-2">
            <Button variant="secondary" className="w-full" asChild>
              <a
                href="https://myaccount.google.com/permissions"
                target="_blank"
                rel="noreferrer"
              >
                Gerenciar permissões no Google
              </a>
            </Button>
            <Button variant="outline" className="w-full" onClick={() => onOpenChange(false)}>
              Fechar
            </Button>
            <Button variant="destructive" className="w-full" onClick={onLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              Desconectar
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};
