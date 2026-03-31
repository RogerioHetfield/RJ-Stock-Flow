import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import {
  useGetProducts,
  useGetCategories,
  useDeleteProduct,
  getGetProductsQueryKey,
} from "@workspace/api-client-react";
import { formatCurrency } from "@/lib/format";
import { getStockStatusBadge, getCategoryColor } from "@/lib/colors";
import { MovementDialog } from "@/components/movement-dialog";
import { SaleDialog } from "@/components/sale-dialog";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Search,
  Plus,
  ArrowDownToLine,
  ArrowUpToLine,
  FilterX,
  Pencil,
  Trash2,
  Loader2,
  Package,
  ShoppingCart,
} from "lucide-react";
import { useDebounce } from "@/hooks/use-debounce";
import { useToast } from "@/hooks/use-toast";

type ProductItem = {
  id: number;
  name: string;
  sku?: string | null;
  categoryId: number;
  categoryName?: string | null;
  unit: string;
  quantity: number;
  minQuantity: number;
  costPrice: number;
  salePrice: number;
  supplier?: string | null;
  stockStatus: "ok" | "low" | "out";
  [key: string]: unknown;
};

function TableSkeleton() {
  return (
    <>
      {[1, 2, 3, 4, 5].map((i) => (
        <TableRow key={i}>
          <TableCell>
            <div className="space-y-1.5">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-3 w-20" />
            </div>
          </TableCell>
          <TableCell><Skeleton className="h-5 w-24 rounded-full" /></TableCell>
          <TableCell className="text-right"><Skeleton className="h-4 w-16 ml-auto" /></TableCell>
          <TableCell className="text-right"><Skeleton className="h-4 w-20 ml-auto" /></TableCell>
          <TableCell className="text-center"><Skeleton className="h-5 w-16 mx-auto rounded-full" /></TableCell>
          <TableCell className="text-right">
            <div className="flex justify-end gap-1">
              {[1, 2, 3, 4, 5].map((j) => <Skeleton key={j} className="h-8 w-8 rounded-md" />)}
            </div>
          </TableCell>
        </TableRow>
      ))}
    </>
  );
}

export default function ProductsList() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebounce(searchTerm, 500);
  const [categoryId, setCategoryId] = useState<string>("all");
  const [stockFilter, setStockFilter] = useState<string>("all");

  const { data: categories } = useGetCategories();
  const { data: products, isLoading } = useGetProducts({
    search: debouncedSearch || undefined,
    categoryId: categoryId !== "all" ? Number(categoryId) : undefined,
    lowStock: stockFilter === "low" ? true : undefined,
    outOfStock: stockFilter === "out" ? true : undefined,
    sortBy: "name",
    sortOrder: "asc",
  });

  const deleteProduct = useDeleteProduct();

  const [movementDialogState, setMovementDialogState] = useState<{
    open: boolean;
    product: ProductItem | null;
    type: "entry" | "exit";
  }>({ open: false, product: null, type: "entry" });

  const [saleDialogState, setSaleDialogState] = useState<{
    open: boolean;
    product: ProductItem | null;
  }>({ open: false, product: null });

  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    product: ProductItem | null;
  }>({ open: false, product: null });

  const openMovement = (product: ProductItem, type: "entry" | "exit") => {
    setMovementDialogState({ open: true, product, type });
  };

  const openSale = (product: ProductItem) => {
    setSaleDialogState({ open: true, product });
  };

  const openDeleteDialog = (product: ProductItem) => {
    setDeleteDialog({ open: true, product });
  };

  const confirmDelete = () => {
    if (!deleteDialog.product) return;
    deleteProduct.mutate(
      { id: deleteDialog.product.id },
      {
        onSuccess: () => {
          toast({ title: "Produto excluído com sucesso" });
          queryClient.invalidateQueries({ queryKey: getGetProductsQueryKey() });
          setDeleteDialog({ open: false, product: null });
        },
        onError: (err: unknown) => {
          const msg = err instanceof Error ? err.message : "Erro desconhecido";
          toast({ variant: "destructive", title: "Erro ao excluir", description: msg });
          setDeleteDialog({ open: false, product: null });
        },
      }
    );
  };

  const clearFilters = () => {
    setSearchTerm("");
    setCategoryId("all");
    setStockFilter("all");
  };

  const hasFilters = searchTerm || categoryId !== "all" || stockFilter !== "all";

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Produtos</h1>
          <p className="text-muted-foreground">Gerencie o catálogo e estoque de produtos.</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/products/new">
            <Button variant="outline">
              <Plus className="mr-2 h-4 w-4" /> Novo Produto
            </Button>
          </Link>
          <Button
            className="bg-violet-600 hover:bg-violet-700 text-white"
            onClick={() => setSaleDialogState({ open: true, product: null })}
          >
            <ShoppingCart className="mr-2 h-4 w-4" /> Registrar Venda
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-wrap gap-3 items-center">
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome ou SKU..."
                className="pl-9"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <Select value={categoryId} onValueChange={setCategoryId}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas categorias</SelectItem>
                {categories?.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id.toString()}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={stockFilter} onValueChange={setStockFilter}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todo estoque</SelectItem>
                <SelectItem value="low">Estoque baixo</SelectItem>
                <SelectItem value="out">Esgotados</SelectItem>
              </SelectContent>
            </Select>

            {hasFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters} className="text-muted-foreground">
                <FilterX className="h-4 w-4 mr-1.5" />
                Limpar filtros
              </Button>
            )}
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="border-t border-border">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30 hover:bg-muted/30">
                  <TableHead className="pl-6 w-[280px] font-semibold text-xs uppercase tracking-wide">Produto</TableHead>
                  <TableHead className="font-semibold text-xs uppercase tracking-wide">Categoria</TableHead>
                  <TableHead className="text-right font-semibold text-xs uppercase tracking-wide">Estoque</TableHead>
                  <TableHead className="text-right font-semibold text-xs uppercase tracking-wide">Preço</TableHead>
                  <TableHead className="text-center font-semibold text-xs uppercase tracking-wide">Status</TableHead>
                  <TableHead className="text-right pr-6 font-semibold text-xs uppercase tracking-wide">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableSkeleton />
                ) : products && products.length > 0 ? (
                  products.map((product) => {
                    const p = product as unknown as ProductItem;
                    const statusBadge = getStockStatusBadge(p.stockStatus);
                    const catColor = getCategoryColor(p.categoryId);

                    return (
                      <TableRow
                        key={p.id}
                        className="group hover:bg-muted/40 transition-colors"
                      >
                        <TableCell className="pl-6 py-3">
                          <Link
                            href={`/products/${p.id}`}
                            className="font-semibold text-sm text-foreground group-hover:text-primary transition-colors hover:underline"
                          >
                            {p.name}
                          </Link>
                          {p.sku && (
                            <p className="text-xs text-muted-foreground mt-0.5">SKU {p.sku}</p>
                          )}
                        </TableCell>
                        <TableCell className="py-3">
                          <Badge variant="outline" className={`font-normal text-xs ${catColor}`}>
                            {p.categoryName}
                          </Badge>
                        </TableCell>
                        <TableCell className="py-3 text-right tabular-nums">
                          <span className="text-sm font-medium">{p.quantity}</span>
                          <span className="text-xs text-muted-foreground ml-1">{p.unit}</span>
                        </TableCell>
                        <TableCell className="py-3 text-right tabular-nums">
                          <span className="text-sm font-semibold">{formatCurrency(p.salePrice)}</span>
                        </TableCell>
                        <TableCell className="py-3 text-center">
                          <Badge variant="outline" className={`text-xs ${statusBadge.className}`}>
                            {statusBadge.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="py-3 pr-6">
                          <div className="flex items-center justify-end gap-1 opacity-70 group-hover:opacity-100 transition-opacity">
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8 text-violet-600 hover:bg-violet-50 hover:text-violet-700"
                              onClick={() => openSale(p)}
                              title="Registrar venda"
                            >
                              <ShoppingCart className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8 text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700"
                              onClick={() => openMovement(p, "entry")}
                              title="Entrada de estoque"
                            >
                              <ArrowDownToLine className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8 text-blue-600 hover:bg-blue-50 hover:text-blue-700"
                              onClick={() => openMovement(p, "exit")}
                              title="Saída de estoque"
                            >
                              <ArrowUpToLine className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8 text-amber-600 hover:bg-amber-50 hover:text-amber-700"
                              onClick={() => setLocation(`/products/${p.id}/edit`)}
                              title="Editar produto"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8 text-red-600 hover:bg-red-50 hover:text-red-700"
                              onClick={() => openDeleteDialog(p)}
                              title="Excluir produto"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="h-56">
                      <div className="flex flex-col items-center justify-center gap-3 text-center">
                        <div className="h-14 w-14 rounded-full bg-muted flex items-center justify-center">
                          <Package className="h-7 w-7 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="font-medium text-muted-foreground">
                            {hasFilters ? "Nenhum produto encontrado" : "Nenhum produto cadastrado"}
                          </p>
                          <p className="text-sm text-muted-foreground mt-0.5">
                            {hasFilters
                              ? "Tente ajustar os filtros ou limpe a busca."
                              : "Comece cadastrando o primeiro produto do seu estoque."}
                          </p>
                        </div>
                        {hasFilters ? (
                          <Button variant="outline" size="sm" onClick={clearFilters}>
                            <FilterX className="h-4 w-4 mr-2" />
                            Limpar filtros
                          </Button>
                        ) : (
                          <Link href="/products/new">
                            <Button size="sm">
                              <Plus className="h-4 w-4 mr-2" />
                              Cadastrar produto
                            </Button>
                          </Link>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <MovementDialog
        open={movementDialogState.open}
        onOpenChange={(open) => setMovementDialogState((prev) => ({ ...prev, open }))}
        product={movementDialogState.product as never}
        defaultType={movementDialogState.type}
      />

      <SaleDialog
        open={saleDialogState.open}
        onOpenChange={(open) => setSaleDialogState((prev) => ({ ...prev, open }))}
        product={saleDialogState.product}
      />

      <AlertDialog
        open={deleteDialog.open}
        onOpenChange={(open) => setDeleteDialog((prev) => ({ ...prev, open }))}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir produto</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir{" "}
              <strong>{deleteDialog.product?.name}</strong>? Esta ação também removerá todo o
              histórico de movimentações e não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700"
              disabled={deleteProduct.isPending}
            >
              {deleteProduct.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="mr-2 h-4 w-4" />
              )}
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
