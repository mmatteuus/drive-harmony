import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { CloudIcon, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || "";
const GOOGLE_SCOPES =
  import.meta.env.VITE_GOOGLE_SCOPES ||
  [
    "https://www.googleapis.com/auth/drive.file",
    "https://www.googleapis.com/auth/userinfo.profile",
    "https://www.googleapis.com/auth/userinfo.email",
  ].join(" ");

declare global {
  interface Window {
    google?: typeof google;
  }
}

const Login = () => {
  const navigate = useNavigate();
  const [googleReady, setGoogleReady] = useState(false);
  const [loading, setLoading] = useState(false);

  const verifyDriveAccess = useCallback(async (accessToken: string) => {
    try {
      const response = await fetch("https://www.googleapis.com/drive/v3/about?fields=user", {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (!response.ok) {
        throw new Error(`Drive API error ${response.status}`);
      }

      const data = await response.json();
      if (!data?.user?.emailAddress) {
        throw new Error("Credenciais inválidas");
      }

      return data;
    } catch (error) {
      console.error("Erro ao validar Drive:", error);
      toast.error("Não foi possível conectar ao Google Drive. Tente novamente.");
      localStorage.removeItem("google_access_token");
      return null;
    }
  }, []);

  const handleSignIn = () => {
    if (!GOOGLE_CLIENT_ID) {
      toast.error("Configure a variável VITE_GOOGLE_CLIENT_ID antes de continuar.");
      return;
    }

    if (!window.google?.accounts?.oauth2) {
      toast.error("Serviço de login do Google não carregou. Tente novamente.");
      return;
    }

    setLoading(true);
    const client = window.google.accounts.oauth2.initTokenClient({
      client_id: GOOGLE_CLIENT_ID,
      scope: GOOGLE_SCOPES,
      prompt: "consent",
      callback: async (tokenResponse) => {
        if (!tokenResponse?.access_token) {
          toast.error("Não foi possível obter o token de acesso.");
          setLoading(false);
          return;
        }

        localStorage.setItem("google_access_token", tokenResponse.access_token);
        const isValid = await verifyDriveAccess(tokenResponse.access_token);
        setLoading(false);

        if (!isValid) return;

        toast.success("Conexão com o Google Drive concluída.");
        navigate("/dashboard");
      },
    });

    client.requestAccessToken();
  };

  useEffect(() => {
    const initGoogleScript = () => {
      if (window.google?.accounts?.oauth2) {
        setGoogleReady(true);
        return;
      }

      const existingScript = document.querySelector<HTMLScriptElement>(
        'script[src="https://accounts.google.com/gsi/client"]',
      );
      if (existingScript) {
        if (window.google?.accounts?.oauth2) {
          setGoogleReady(true);
        } else {
          existingScript.addEventListener("load", () => setGoogleReady(true), { once: true });
        }
        return;
      }

      const script = document.createElement("script");
      script.id = "google-identity-script";
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.defer = true;
      script.onload = () => setGoogleReady(true);
      script.onerror = () => toast.error("Não foi possível carregar o Google Identity Services");
      document.body.appendChild(script);
    };

    const validateExistingSession = async () => {
      const token = localStorage.getItem("google_access_token");
      if (!token) return;
      const isValid = await verifyDriveAccess(token);
      if (isValid) {
        navigate("/dashboard");
      }
    };

    validateExistingSession().finally(initGoogleScript);
  }, [navigate, verifyDriveAccess]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-secondary to-background p-4">
      <div className="w-full max-w-xl">
        <div className="text-center space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-1000 bg-card/70 backdrop-blur border rounded-3xl p-10 shadow-elegant">
          <div className="flex justify-center">
            <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg">
              <CloudIcon className="h-10 w-10 text-primary-foreground" />
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-sm uppercase tracking-[0.3em] text-muted-foreground">Drive Harmony</p>
            <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Seu hub premium para o Google Drive
            </h1>
            <p className="text-muted-foreground text-lg">
              Conecte seu Drive, busque, organize, faça upload e download de arquivos com uma interface única.
            </p>
          </div>

          <div className="pt-2 space-y-4">
            <Button
              onClick={handleSignIn}
              size="lg"
              disabled={!googleReady || loading}
              className="w-full h-14 text-lg font-semibold shadow-elegant hover:shadow-xl transition-all duration-300"
            >
              {loading ? "Conectando..." : "Entrar com Google"}
            </Button>
            <p className="text-xs text-muted-foreground flex items-center justify-center gap-2">
              <ShieldCheck className="h-4 w-4" />
              Usamos apenas as permissões necessárias para acessar seus arquivos. O conteúdo fica sempre no seu Drive.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
