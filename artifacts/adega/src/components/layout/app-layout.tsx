import { Link, useLocation } from "wouter";
import { Package, LayoutDashboard, Tags, History, BarChart3, LogOut, Users, ShieldCheck, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/auth-context";
import { Separator } from "@/components/ui/separator";

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const [location] = useLocation();
  const { user, logout, isAdmin } = useAuth();

  const navItems = [
    { href: "/", label: "Início", icon: LayoutDashboard },
    { href: "/products", label: "Produtos", icon: Package },
    { href: "/categories", label: "Categorias", icon: Tags },
    { href: "/movements", label: "Movimentações", icon: History },
    { href: "/reports", label: "Relatórios", icon: BarChart3 },
  ];

  const adminNavItems = [
    { href: "/users", label: "Usuários", icon: Users },
  ];

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <aside className="w-64 flex-shrink-0 border-r border-border bg-card flex flex-col">
        <div className="h-16 flex items-center px-6 border-b border-border">
          <div className="flex items-center gap-2 text-primary">
            <img
              src="/logo.png"
              alt="RJ Gás & Água"
              className="mb-1 h-20 w-auto object-contain drop-shadow-md"
            />
            <span className="text-xl font-bold tracking-tight">RJ Stock Flow</span>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {navItems.map((item) => {
            const isActive = location === item.href || (item.href !== "/" && location.startsWith(item.href));
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                }`}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}

          {isAdmin && (
            <>
              <Separator className="my-2" />
              <p className="px-3 py-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Administração
              </p>
              {adminNavItems.map((item) => {
                const isActive = location === item.href || location.startsWith(item.href);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                );
              })}
            </>
          )}
        </nav>

        <div className="border-t border-border">
          {user && (
            <div className="px-4 py-3 flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                {isAdmin ? (
                  <ShieldCheck className="h-4 w-4 text-primary" />
                ) : (
                  <UserRound className="h-4 w-4 text-primary" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate leading-tight">{user.name}</p>
                <p className="text-xs text-muted-foreground capitalize leading-tight">
                  {user.role === "admin" ? "Administrador" : "Funcionário"}
                </p>
              </div>
            </div>
          )}
          <div className="px-3 pb-3">
            <Button
              variant="ghost"
              className="w-full justify-start text-muted-foreground hover:text-destructive"
              onClick={logout}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sair do sistema
            </Button>
          </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <div className="flex-1 overflow-y-auto p-8">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
