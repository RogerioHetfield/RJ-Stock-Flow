import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";

import { AuthProvider } from "@/contexts/auth-context";
import { AuthGuard } from "@/components/auth-guard";
import { AdminGuard } from "@/components/admin-guard";
import { AppLayout } from "@/components/layout/app-layout";
import Login from "@/pages/login";
import Setup from "@/pages/setup";
import NotFound from "@/pages/not-found";

import Dashboard from "@/pages/dashboard";
import ProductsList from "@/pages/products/index";
import ProductForm from "@/pages/products/form";
import ProductDetail from "@/pages/products/detail";
import CategoriesList from "@/pages/categories";
import MovementsList from "@/pages/movements";
import Reports from "@/pages/reports";
import UsersList from "@/pages/users/index";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
    },
  },
});

function ProtectedLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <AppLayout>{children}</AppLayout>
    </AuthGuard>
  );
}

function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <AdminGuard>
        <AppLayout>{children}</AppLayout>
      </AdminGuard>
    </AuthGuard>
  );
}

function AppRouter() {
  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route path="/setup" component={Setup} />

      <Route path="/">
        <ProtectedLayout><Dashboard /></ProtectedLayout>
      </Route>
      <Route path="/products/new">
        <ProtectedLayout><ProductForm /></ProtectedLayout>
      </Route>
      <Route path="/products/:id/edit">
        <ProtectedLayout><ProductForm /></ProtectedLayout>
      </Route>
      <Route path="/products/:id">
        <ProtectedLayout><ProductDetail /></ProtectedLayout>
      </Route>
      <Route path="/products">
        <ProtectedLayout><ProductsList /></ProtectedLayout>
      </Route>
      <Route path="/categories">
        <ProtectedLayout><CategoriesList /></ProtectedLayout>
      </Route>
      <Route path="/movements">
        <ProtectedLayout><MovementsList /></ProtectedLayout>
      </Route>
      <Route path="/reports">
        <ProtectedLayout><Reports /></ProtectedLayout>
      </Route>
      <Route path="/users">
        <AdminLayout><UsersList /></AdminLayout>
      </Route>

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL?.replace(/\/$/, "") || ""}>
          <AuthProvider>
            <AppRouter />
          </AuthProvider>
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
