import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useAuth } from "@/contexts/auth-context";
import { useToast } from "@/hooks/use-toast";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Separator } from "@/components/ui/separator";
import {
  Users,
  Plus,
  Pencil,
  Trash2,
  Loader2,
  ShieldCheck,
  UserCheck,
  UserX,
  Power,
} from "lucide-react";

type AppUser = {
  id: number;
  name: string;
  email: string;
  role: string;
  active: boolean;
  createdAt: string;
};

const userFormSchema = z.object({
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  email: z.string().email("E-mail inválido"),
  password: z.string().optional(),
  role: z.enum(["admin", "employee"]),
  active: z.boolean(),
});

type UserFormValues = z.infer<typeof userFormSchema>;

function authFetch(url: string, options: RequestInit = {}) {
  const token = localStorage.getItem("adega_token");
  return fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers as Record<string, string> || {}),
      Authorization: token ? `Bearer ${token}` : "",
    },
  });
}

const USERS_QUERY_KEY = ["users"];

function RoleBadge({ role }: { role: string }) {
  if (role === "admin") {
    return (
      <Badge variant="outline" className="bg-violet-50 text-violet-700 border-violet-200 gap-1">
        <ShieldCheck className="h-3 w-3" />
        Admin
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="bg-slate-50 text-slate-600 border-slate-200 gap-1">
      <UserCheck className="h-3 w-3" />
      Funcionário
    </Badge>
  );
}

export default function UsersList() {
  const { user: currentUser } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [formDialog, setFormDialog] = useState<{ open: boolean; user: AppUser | null }>({
    open: false,
    user: null,
  });
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; user: AppUser | null }>({
    open: false,
    user: null,
  });

  const { data: users, isLoading } = useQuery<AppUser[]>({
    queryKey: USERS_QUERY_KEY,
    queryFn: async () => {
      const r = await authFetch("/api/users");
      if (!r.ok) throw new Error("Falha ao carregar usuários");
      return r.json();
    },
  });

  const createUserMutation = useMutation({
    mutationFn: async (data: UserFormValues) => {
      const r = await authFetch("/api/users", {
        method: "POST",
        body: JSON.stringify(data),
      });
      const result = await r.json();
      if (!r.ok) throw new Error(result.message || "Erro ao criar usuário");
      return result;
    },
    onSuccess: () => {
      toast({ title: "Usuário criado com sucesso" });
      queryClient.invalidateQueries({ queryKey: USERS_QUERY_KEY });
      setFormDialog({ open: false, user: null });
    },
    onError: (err: Error) => {
      toast({ variant: "destructive", title: "Erro ao criar usuário", description: err.message });
    },
  });

  const updateUserMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: UserFormValues }) => {
      const r = await authFetch(`/api/users/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      });
      const result = await r.json();
      if (!r.ok) throw new Error(result.message || "Erro ao atualizar usuário");
      return result;
    },
    onSuccess: () => {
      toast({ title: "Usuário atualizado com sucesso" });
      queryClient.invalidateQueries({ queryKey: USERS_QUERY_KEY });
      setFormDialog({ open: false, user: null });
    },
    onError: (err: Error) => {
      toast({ variant: "destructive", title: "Erro ao atualizar", description: err.message });
    },
  });

  const toggleStatusMutation = useMutation({
    mutationFn: async (id: number) => {
      const r = await authFetch(`/api/users/${id}/status`, { method: "PATCH" });
      const result = await r.json();
      if (!r.ok) throw new Error(result.message || "Erro ao alterar status");
      return result;
    },
    onSuccess: (updated: AppUser) => {
      toast({
        title: updated.active ? "Usuário ativado" : "Usuário desativado",
      });
      queryClient.invalidateQueries({ queryKey: USERS_QUERY_KEY });
    },
    onError: (err: Error) => {
      toast({ variant: "destructive", title: "Erro ao alterar status", description: err.message });
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (id: number) => {
      const r = await authFetch(`/api/users/${id}`, { method: "DELETE" });
      const result = await r.json();
      if (!r.ok) throw new Error(result.message || "Erro ao excluir usuário");
      return result;
    },
    onSuccess: () => {
      toast({ title: "Usuário excluído com sucesso" });
      queryClient.invalidateQueries({ queryKey: USERS_QUERY_KEY });
      setDeleteDialog({ open: false, user: null });
    },
    onError: (err: Error) => {
      toast({ variant: "destructive", title: "Erro ao excluir", description: err.message });
      setDeleteDialog({ open: false, user: null });
    },
  });

  const openCreate = () => setFormDialog({ open: true, user: null });
  const openEdit = (user: AppUser) => setFormDialog({ open: true, user });

  const isEdit = !!formDialog.user;

  const form = useForm<UserFormValues>({
    resolver: zodResolver(userFormSchema),
    defaultValues: { name: "", email: "", password: "", role: "employee", active: true },
  });

  const openFormDialog = (user: AppUser | null) => {
    if (user) {
      form.reset({
        name: user.name,
        email: user.email,
        password: "",
        role: user.role as "admin" | "employee",
        active: user.active,
      });
    } else {
      form.reset({ name: "", email: "", password: "", role: "employee", active: true });
    }
    setFormDialog({ open: true, user });
  };

  const onSubmit = (data: UserFormValues) => {
    if (isEdit && formDialog.user) {
      const payload = { ...data };
      if (!payload.password) delete payload.password;
      updateUserMutation.mutate({ id: formDialog.user.id, data: payload });
    } else {
      if (!data.password) {
        form.setError("password", { message: "Senha é obrigatória para novos usuários" });
        return;
      }
      createUserMutation.mutate(data);
    }
  };

  const isMutating = createUserMutation.isPending || updateUserMutation.isPending;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Usuários</h1>
          <p className="text-muted-foreground">Gerencie os usuários e permissões do sistema.</p>
        </div>
        <Button onClick={() => openFormDialog(null)}>
          <Plus className="mr-2 h-4 w-4" /> Novo Usuário
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="border-b border-border">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30 hover:bg-muted/30">
                  <TableHead className="pl-6 font-semibold text-xs uppercase tracking-wide">Nome</TableHead>
                  <TableHead className="font-semibold text-xs uppercase tracking-wide">E-mail</TableHead>
                  <TableHead className="font-semibold text-xs uppercase tracking-wide">Perfil</TableHead>
                  <TableHead className="text-center font-semibold text-xs uppercase tracking-wide">Status</TableHead>
                  <TableHead className="font-semibold text-xs uppercase tracking-wide">Cadastrado em</TableHead>
                  <TableHead className="text-right pr-6 font-semibold text-xs uppercase tracking-wide">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  [1, 2, 3].map((i) => (
                    <TableRow key={i}>
                      <TableCell className="pl-6"><div className="space-y-1.5"><Skeleton className="h-4 w-32" /><Skeleton className="h-3 w-20" /></div></TableCell>
                      <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-24 rounded-full" /></TableCell>
                      <TableCell className="text-center"><Skeleton className="h-5 w-16 mx-auto rounded-full" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell className="text-right pr-6"><div className="flex justify-end gap-1"><Skeleton className="h-8 w-8 rounded-md" /><Skeleton className="h-8 w-8 rounded-md" /><Skeleton className="h-8 w-8 rounded-md" /></div></TableCell>
                    </TableRow>
                  ))
                ) : users && users.length > 0 ? (
                  users.map((u) => {
                    const isCurrentUser = u.id === currentUser?.id;
                    const canDelete = !isCurrentUser;
                    const canToggle = !isCurrentUser;

                    return (
                      <TableRow key={u.id} className="group hover:bg-muted/40 transition-colors">
                        <TableCell className="pl-6 py-3">
                          <p className="font-semibold text-sm">{u.name}</p>
                          {isCurrentUser && <span className="text-xs text-muted-foreground">(você)</span>}
                        </TableCell>
                        <TableCell className="py-3 text-sm text-muted-foreground">{u.email}</TableCell>
                        <TableCell className="py-3"><RoleBadge role={u.role} /></TableCell>
                        <TableCell className="py-3 text-center">
                          {u.active ? (
                            <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">Ativo</Badge>
                          ) : (
                            <Badge variant="outline" className="bg-slate-50 text-slate-500 border-slate-200">Inativo</Badge>
                          )}
                        </TableCell>
                        <TableCell className="py-3 text-sm text-muted-foreground">
                          {new Date(u.createdAt).toLocaleDateString("pt-BR")}
                        </TableCell>
                        <TableCell className="py-3 pr-6">
                          <div className="flex items-center justify-end gap-1 opacity-70 group-hover:opacity-100 transition-opacity">
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8 text-amber-600 hover:bg-amber-50"
                              onClick={() => openFormDialog(u)}
                              title="Editar usuário"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            {canToggle && (
                              <Button
                                size="icon"
                                variant="ghost"
                                className={`h-8 w-8 ${u.active ? "text-slate-500 hover:bg-slate-50 hover:text-slate-700" : "text-emerald-600 hover:bg-emerald-50"}`}
                                onClick={() => toggleStatusMutation.mutate(u.id)}
                                disabled={toggleStatusMutation.isPending}
                                title={u.active ? "Desativar usuário" : "Ativar usuário"}
                              >
                                {u.active ? <UserX className="h-3.5 w-3.5" /> : <Power className="h-3.5 w-3.5" />}
                              </Button>
                            )}
                            {canDelete && (
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8 text-red-600 hover:bg-red-50"
                                onClick={() => setDeleteDialog({ open: true, user: u })}
                                title="Excluir usuário"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="h-48">
                      <div className="flex flex-col items-center justify-center gap-3 text-center">
                        <div className="h-14 w-14 rounded-full bg-muted flex items-center justify-center">
                          <Users className="h-7 w-7 text-muted-foreground" />
                        </div>
                        <p className="font-medium text-muted-foreground">Nenhum usuário cadastrado.</p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={formDialog.open} onOpenChange={(open) => setFormDialog((prev) => ({ ...prev, open }))}>
        <DialogContent className="sm:max-w-[460px]">
          <DialogHeader>
            <DialogTitle>{isEdit ? "Editar Usuário" : "Novo Usuário"}</DialogTitle>
            <DialogDescription>
              {isEdit ? "Atualize as informações do usuário." : "Preencha os dados para cadastrar um novo usuário."}
            </DialogDescription>
          </DialogHeader>
          <Separator />
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-2">
              <FormField control={form.control} name="name" render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome completo *</FormLabel>
                  <FormControl><Input placeholder="Nome do usuário" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="email" render={({ field }) => (
                <FormItem>
                  <FormLabel>E-mail *</FormLabel>
                  <FormControl><Input type="email" placeholder="usuario@empresa.com" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="password" render={({ field }) => (
                <FormItem>
                  <FormLabel>{isEdit ? "Nova senha (deixe em branco para manter)" : "Senha *"}</FormLabel>
                  <FormControl><Input type="password" placeholder={isEdit ? "••••••••" : "Mínimo 6 caracteres"} {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="role" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Perfil *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="admin">Administrador</SelectItem>
                        <SelectItem value="employee">Funcionário</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="active" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select
                      onValueChange={(v) => field.onChange(v === "true")}
                      value={field.value ? "true" : "false"}
                    >
                      <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="true">Ativo</SelectItem>
                        <SelectItem value="false">Inativo</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>

              <DialogFooter className="pt-2">
                <Button type="button" variant="outline" onClick={() => setFormDialog({ open: false, user: null })}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={isMutating}>
                  {isMutating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  {isEdit ? "Salvar Alterações" : "Cadastrar Usuário"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog((prev) => ({ ...prev, open }))}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir usuário</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir <strong>{deleteDialog.user?.name}</strong>? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteDialog.user && deleteUserMutation.mutate(deleteDialog.user.id)}
              className="bg-red-600 hover:bg-red-700"
              disabled={deleteUserMutation.isPending}
            >
              {deleteUserMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
