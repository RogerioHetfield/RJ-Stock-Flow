import { useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/contexts/auth-context";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isLoading, isSetupNeeded, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (isLoading) return;
    if (isSetupNeeded) {
      setLocation("/setup");
      return;
    }
    if (!isAuthenticated) {
      setLocation("/login");
    }
  }, [isLoading, isSetupNeeded, isAuthenticated, setLocation]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (isSetupNeeded || !isAuthenticated) return null;

  return <>{children}</>;
}
