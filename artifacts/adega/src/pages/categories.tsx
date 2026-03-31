import { useState } from "react";
import { useGetCategories, useCreateCategory, useUpdateCategory, useDeleteCategory, getGetCategoriesQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { getCategoryColor } from "@/lib/colors";
import { Category } from "@workspace/api-client-react/src/generated/api.schemas";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { Plus, Edit2, Trash2, Loader2, Search } from "lucide-react";

const categorySchema = z.object({
  name: z.string().min(1, "O nome é obrigatório"),
  description: z.string().optional(),
});

type CategoryFormValues = z.infer<typeof categorySchema>;

export default function CategoriesList() {
  const { data: categories, isLoading } = useGetCategories();
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const createCategory = useCreateCategory();
  const updateCategory = useUpdateCategory();
  const deleteCategory = useDeleteCategory();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  const form = useForm<CategoryFormValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: { name: "", description: "" },
  });

  const openNew = () => {
    setEditingCategory(null);
    form.reset({ name: "", description: "" });
    setDialogOpen(true);
  };

  const openEdit = (cat: Category) => {
    setEditingCategory(cat);
    form.reset({ name: cat.name, description: cat.description || "" });
    setDialogOpen(true);
  };

  const onSubmit = (data: CategoryFormValues) => {
    if (editingCategory) {
      updateCategory.mutate(
        { id: editingCategory.id, data },
        {
          onSuccess: () => {
            toast({ title: "Categoria atualizada" });
            queryClient.invalidateQueries({ queryKey: getGetCategoriesQueryKey() });
            setDialogOpen(false);
          },
          onError: (err: any) => toast({ variant: "destructive", title: "Erro", description: err.message })
        }
      );
    } else {
      createCategory.mutate(
        { data },
        {
          onSuccess: () => {
            toast({ title: "Categoria criada" });
            queryClient.invalidateQueries({ queryKey: getGetCategoriesQueryKey() });
            setDialogOpen(false);
          },
          onError: (err: any) => toast({ variant: "destructive", title: "Erro", description: err.message })
        }
      );
    }
  };

  const handleDelete = (id: number) => {
    deleteCategory.mutate(
      { id },
      {
        onSuccess: () => {
          toast({ title: "Categoria excluída" });
          queryClient.invalidateQueries({ queryKey: getGetCategoriesQueryKey() });
        },
        onError: (err: any) => toast({ variant: "destructive", title: "Erro ao excluir", description: err.message })
      }
    );
  };

  const filteredCategories = categories?.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()));
  const isPending = createCategory.isPending || updateCategory.isPending;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Categorias</h1>
          <p className="text-muted-foreground">Organize os produtos da sua adega.</p>
        </div>
        <Button onClick={openNew}>
          <Plus className="mr-2 h-4 w-4" /> Nova Categoria
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="relative max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar categoria..."
              className="pl-9"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border border-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead className="text-center">Produtos</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow><TableCell colSpan={4} className="h-24 text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto" /></TableCell></TableRow>
                ) : filteredCategories && filteredCategories.length > 0 ? (
                  filteredCategories.map((cat) => (
                    <TableRow key={cat.id}>
                      <TableCell className="font-medium">
                        <Badge variant="outline" className={`font-normal ${getCategoryColor(cat.id)}`}>
                          {cat.name}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground truncate max-w-xs">{cat.description || "-"}</TableCell>
                      <TableCell className="text-center font-medium">{cat.productCount}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => openEdit(cat)}>
                          <Edit2 className="h-4 w-4 text-muted-foreground" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" disabled={cat.productCount > 0} title={cat.productCount > 0 ? "Não é possível excluir categoria com produtos" : "Excluir"}>
                              <Trash2 className="h-4 w-4 text-rose-500" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Excluir categoria?</AlertDialogTitle>
                              <AlertDialogDescription>A categoria "{cat.name}" será removida permanentemente.</AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDelete(cat.id)} className="bg-rose-600">Excluir</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow><TableCell colSpan={4} className="h-24 text-center text-muted-foreground">Nenhuma categoria encontrada.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingCategory ? "Editar Categoria" : "Nova Categoria"}</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField control={form.control} name="name" render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome</FormLabel>
                  <FormControl><Input placeholder="Ex: Cervejas Artesanais" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="description" render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição (opcional)</FormLabel>
                  <FormControl><Textarea className="resize-none" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
                <Button type="submit" disabled={isPending}>
                  {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Salvar
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
