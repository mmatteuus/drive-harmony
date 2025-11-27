import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { CloudIcon } from "lucide-react";
import { toast } from "sonner";

declare global {
  interface Window {
    google: any;
  }
}

const Login = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Check if already logged in
    const token = localStorage.getItem("google_access_token");
    if (token) {
      navigate("/dashboard");
      return;
    }

    // Load Google Identity Services
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    document.body.appendChild(script);

    script.onload = () => {
      if (window.google) {
        window.google.accounts.id.initialize({
          client_id: "YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com",
          callback: handleCredentialResponse,
        });
      }
    };

    return () => {
      document.body.removeChild(script);
    };
  }, [navigate]);

  const handleCredentialResponse = (response: any) => {
    // Store the credential
    localStorage.setItem("google_id_token", response.credential);
    
    // Get access token for Drive API
    requestDriveAccess();
  };

  const requestDriveAccess = () => {
    const client = window.google.accounts.oauth2.initTokenClient({
      client_id: "YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com",
      scope: "https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email",
      callback: (tokenResponse: any) => {
        if (tokenResponse.access_token) {
          localStorage.setItem("google_access_token", tokenResponse.access_token);
          toast.success("Successfully connected to Google Drive!");
          navigate("/dashboard");
        } else {
          toast.error("Failed to get access token");
        }
      },
    });
    client.requestAccessToken();
  };

  const handleSignIn = () => {
    requestDriveAccess();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-secondary to-background p-4">
      <div className="w-full max-w-md">
        <div className="text-center space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-1000">
          <div className="flex justify-center">
            <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-elegant">
              <CloudIcon className="h-10 w-10 text-primary-foreground" />
            </div>
          </div>
          
          <div className="space-y-2">
            <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Drive Premium
            </h1>
            <p className="text-muted-foreground text-lg">
              Conecte seu Google Drive e gerencie seus arquivos de forma simples e organizada
            </p>
          </div>

          <div className="pt-4">
            <Button 
              onClick={handleSignIn}
              size="lg"
              className="w-full h-14 text-lg font-semibold shadow-elegant hover:shadow-xl transition-all duration-300"
            >
              <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Entrar com Google
            </Button>
          </div>

          <div className="pt-4 text-xs text-muted-foreground px-4">
            <p>
              Usamos somente as permissões necessárias para acessar seus arquivos e nunca armazenamos conteúdo dos arquivos em nossos servidores.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
