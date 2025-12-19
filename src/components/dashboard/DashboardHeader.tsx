import { CloudIcon, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Link } from "react-router-dom";

interface DashboardHeaderProps {
  userInfo: any;
  onLogout: () => void;
  onOpenAccount: () => void;
}

export const DashboardHeader = ({ userInfo, onLogout, onOpenAccount }: DashboardHeaderProps) => {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
            <CloudIcon className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Drive Harmony
          </span>
        </div>

        {userInfo && (
          <div className="flex items-center gap-4">
            <Button asChild variant="outline" size="sm" className="hidden md:inline-flex">
              <Link to="/crm/customers">CRM</Link>
            </Button>
            <div className="hidden sm:flex items-center gap-3">
              <div className="text-right">
                <p className="text-sm font-medium">{userInfo.name}</p>
                <p className="text-xs text-muted-foreground">{userInfo.email}</p>
              </div>
              <Avatar>
                <AvatarImage src={userInfo.picture} alt={userInfo.name} />
                <AvatarFallback>{userInfo.name?.[0] || "U"}</AvatarFallback>
              </Avatar>
            </div>
            <Button variant="secondary" size="sm" onClick={onOpenAccount}>
              Conta
            </Button>
            <Button variant="ghost" size="icon" onClick={onLogout}>
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        )}
      </div>
    </header>
  );
};
