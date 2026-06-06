import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@workspace/replit-auth-web";
import { useState } from "react";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import { Cpu, LogIn, X } from "lucide-react";

const queryClient = new QueryClient();

function LoginBanner({ onDismiss }: { onDismiss: () => void }) {
  const { login } = useAuth();
  return (
    <div className="flex items-center gap-3 px-4 py-2.5 bg-primary/10 border-b border-primary/20 text-sm dark">
      <Cpu className="w-4 h-4 text-primary shrink-0" />
      <span className="text-foreground/80 flex-1">
        <button onClick={login} className="text-primary font-semibold hover:underline">
          로그인
        </button>
        {" "}하면 모든 기기에서 대화를 이어갈 수 있습니다.
      </span>
      <button onClick={onDismiss} className="text-muted-foreground hover:text-foreground transition-colors">
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

function AuthGate({ children }: { children: React.ReactNode }) {
  const { isLoading, isAuthenticated } = useAuth();
  const [bannerDismissed, setBannerDismissed] = useState(false);

  if (isLoading) {
    return (
      <div className="flex h-[100dvh] w-full items-center justify-center bg-background dark">
        <div className="flex flex-col items-center gap-4">
          <Cpu className="w-10 h-10 text-primary animate-pulse" />
          <span className="text-muted-foreground font-mono text-sm">시스템 초기화 중...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[100dvh] dark">
      {!isAuthenticated && !bannerDismissed && (
        <LoginBanner onDismiss={() => setBannerDismissed(true)} />
      )}
      <div className="flex-1 min-h-0">
        {children}
      </div>
    </div>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <AuthGate>
            <Router />
          </AuthGate>
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
