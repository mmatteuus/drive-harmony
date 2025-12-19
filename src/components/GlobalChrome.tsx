import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";

const canNavigateBack = () => {
  const state = window.history.state as { idx?: unknown } | null;
  if (typeof state?.idx === "number") return state.idx > 0;
  return window.history.length > 1;
};

export function GlobalChrome() {
  const navigate = useNavigate();
  const location = useLocation();
  const hasStickyHeader = location.pathname.startsWith("/dashboard");

  return (
    <>
      <div
        className={`fixed left-2 sm:left-4 ${hasStickyHeader ? "top-20" : "top-2 sm:top-4"} z-40 pointer-events-none`}
      >
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="pointer-events-auto shadow-sm"
          onClick={() => (canNavigateBack() ? navigate(-1) : navigate("/"))}
        >
          <ArrowLeft className="h-4 w-4 sm:mr-2" />
          <span className="hidden sm:inline">Voltar</span>
        </Button>
      </div>

      <div className="fixed bottom-2 left-0 right-0 z-40 flex justify-center pointer-events-none">
        <div className="text-[11px] text-muted-foreground">Desenvolvido por MtsFerreira</div>
      </div>
    </>
  );
}
