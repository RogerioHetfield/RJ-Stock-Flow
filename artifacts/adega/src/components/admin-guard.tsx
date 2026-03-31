import { useLocation } from "wouter";
import { useEffect } from "react";
import { useAuth } from "@/contexts/auth-context";

export function AdminGuard({ children }: { children: React.ReactNode }) {
  const { isAdmin, isAuthenticated, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!isLoading && isAuthenticated && !isAdmin) {
      setLocation("/");
    }
  }, [isLoading, isAuthenticated, isAdmin, setLocation]);

  if (isLoading) return null;
  if (!isAuthenticated || !isAdmin) return null;

  return <>{children}</>;
}
