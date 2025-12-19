import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

const canNavigateBack = () => {
  const state = window.history.state as { idx?: unknown } | null;
  if (typeof state?.idx === "number") return state.idx > 0;
  return window.history.length > 1;
};

export function GlobalChrome() {
  const navigate = useNavigate();

  return (
    <>
      <div className="fixed left-4 top-4 z-50 pointer-events-none">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="pointer-events-auto shadow-sm"
          onClick={() => (canNavigateBack() ? navigate(-1) : navigate("/"))}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>
      </div>

      <div className="fixed bottom-3 left-0 right-0 z-40 flex justify-center pointer-events-none">
        <div className="text-xs text-muted-foreground">
          Desenvolvido por MtsFerreira
        </div>
      </div>
    </>
  );
}

