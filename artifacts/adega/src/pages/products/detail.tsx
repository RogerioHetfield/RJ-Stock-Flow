import { useState } from "react";
import { useParams, Link, useLocation } from "wouter";
import { useGetProduct, useDeleteProduct, getGetProductsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { formatCurrency, formatDateTime } from "@/lib/format";
import { getStockStatusBadge, getCategoryColor, getMovementTypeBadge } from "@/lib/colors";
import { MovementDialog } from "@/components/movement-dialog";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Edit, Trash2, ArrowDownToLine, ArrowUpToLine, History, AlertTriangle, Loader2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const productId = Number(id);
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: product, isLoading } = useGetProduct(productId, {
    query: { enabled: !!productId, queryKey: ['product', productId] }
  });

  const deleteMutation = useDeleteProduct();

  const [movementDialogState, setMovementDialogState] = useState<{
    open: boolean;
    type: "entry" | "exit" | "loss" | "adjustment";
  }>({
    open: false,
    type: "entry"
  });

  if (isLoading) {
    return <div className="flex justify-center p-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  if (!product) {
    return <div className="text-center p-12 text-muted-foreground">Produto não encontrado.</div>;
  }

  const handleDelete = () => {
    deleteMutation.mutate({ id: productId }, {
      onSuccess: () => {
        toast({ title: "Produto excluído com sucesso" });
        queryClient.invalidateQueries({ queryKey: getGetProductsQueryKey() });
        setLocation("/products");
      },
      onError: (err: any) => {
        toast({ variant: "destructive", title: "Erro ao excluir", description: err.message });
      }
    });
  };

  const statusBadge = getStockStatusBadge(product.stockStatus);
  const catColor = getCategoryColor(product.categoryId);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <Link href="/products">
            <Button variant="outline" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight">{product.name}</h1>
              <Badge variant="outline" className={statusBadge.className}>{statusBadge.label}</Badge>
            </div>
            <p className="text-muted-foreground">
              {product.sku && <span className="mr-3">SKU: {product.sku}</span>}
              <Badge variant="outline" className={`font-normal ${catColor}`}>{product.categoryName}</Badge>
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Link href={`/products/${productId}/edit`}>
            <Button variant="outline">
              <Edit className="mr-2 h-4 w-4" /> Editar
            </Button>
          </Link>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" className="bg-rose-600 hover:bg-rose-700">
                <Trash2 className="mr-2 h-4 w-4" /> Excluir
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Excluir produto?</AlertDialogTitle>
                <AlertDialogDescription>
                  Esta ação não pode ser desfeita. Todos os registros de movimentação associados a este produto também podem ser afetados.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete} className="bg-rose-600 hover:bg-rose-700">
                  {deleteMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Sim, excluir"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Detalhes do Produto</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Preço de Custo</p>
                <p className="text-lg font-semibold">{formatCurrency(product.costPrice)}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Preço de Venda</p>
                <p className="text-lg font-semibold text-primary">{formatCurrency(product.salePrice)}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Lucro por Unidade</p>
                <p className="text-lg font-semibold text-emerald-600">{formatCurrency(product.profitPerUnit)}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Margem Estimada</p>
                <p className="text-lg font-semibold">
                  {product.salePrice > 0 ? `${Math.round((product.profitPerUnit / product.salePrice) * 100)}%` : '0%'}
                </p>
              </div>
            </div>

            <Separator />

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Fornecedor</p>
                <p className="text-base">{product.supplier || "-"}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Data de Cadastro</p>
                <p className="text-base">{formatDateTime(product.createdAt)}</p>
              </div>
              <div className="col-span-2">
                <p className="text-sm font-medium text-muted-foreground">Observações</p>
                <p className="text-base whitespace-pre-wrap">{product.observations || "-"}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Status do Estoque</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex flex-col items-center justify-center p-6 bg-secondary/50 rounded-lg border border-border">
              <span className="text-5xl font-bold">{product.quantity}</span>
              <span className="text-muted-foreground mt-1">{product.unit}(s)</span>
              
              {product.quantity <= product.minQuantity && (
                <div className="mt-4 flex items-center gap-2 text-amber-600 bg-amber-50 px-3 py-1.5 rounded-full text-sm font-medium border border-amber-200">
                  <AlertTriangle className="h-4 w-4" />
                  Abaixo do mínimo ({product.minQuantity})
                </div>
              )}
            </div>

            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Valor Total Investido:</span>
                <span className="font-medium">{formatCurrency(product.totalInvested)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Valor Total de Venda:</span>
                <span className="font-medium">{formatCurrency(product.totalSaleValue)}</span>
              </div>
              <Separator />
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground font-medium">Lucro Estimado Total:</span>
                <span className="font-bold text-emerald-600">{formatCurrency(product.estimatedProfit)}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2">
              <Button className="w-full" onClick={() => setMovementDialogState({ open: true, type: "entry" })}>
                <ArrowDownToLine className="mr-2 h-4 w-4" /> Entrada
              </Button>
              <Button variant="secondary" className="w-full" onClick={() => setMovementDialogState({ open: true, type: "exit" })}>
                <ArrowUpToLine className="mr-2 h-4 w-4" /> Saída
              </Button>
              <Button variant="outline" className="w-full text-amber-600 border-amber-200 hover:bg-amber-50" onClick={() => setMovementDialogState({ open: true, type: "adjustment" })}>
                Ajuste
              </Button>
              <Button variant="outline" className="w-full text-rose-600 border-rose-200 hover:bg-rose-50" onClick={() => setMovementDialogState({ open: true, type: "loss" })}>
                Perda
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" /> Histórico de Movimentações
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border border-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead className="text-right">Qtd Anterior</TableHead>
                  <TableHead className="text-right">Movimento</TableHead>
                  <TableHead className="text-right">Estoque Final</TableHead>
                  <TableHead>Usuário</TableHead>
                  <TableHead>Observação</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {product.movements && product.movements.length > 0 ? (
                  product.movements.map((mov) => {
                    const badge = getMovementTypeBadge(mov.type);
                    const isPositive = mov.type === 'entry' || (mov.type === 'adjustment' && mov.quantity > 0);
                    
                    return (
                      <TableRow key={mov.id}>
                        <TableCell className="whitespace-nowrap">{formatDateTime(mov.createdAt)}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={badge.className}>{badge.label}</Badge>
                        </TableCell>
                        <TableCell className="text-right text-muted-foreground">{mov.previousQuantity}</TableCell>
                        <TableCell className={`text-right font-medium ${isPositive ? 'text-emerald-600' : 'text-rose-600'}`}>
                          {isPositive ? '+' : ''}{mov.quantity}
                        </TableCell>
                        <TableCell className="text-right font-bold">{mov.newQuantity}</TableCell>
                        <TableCell>{mov.userName}</TableCell>
                        <TableCell className="text-muted-foreground text-sm max-w-[200px] truncate" title={mov.observations}>
                          {mov.observations || "-"}
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                      Nenhuma movimentação registrada para este produto.
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
        onOpenChange={(open) => setMovementDialogState(prev => ({...prev, open}))}
        product={product}
        defaultType={movementDialogState.type}
      />
    </div>
  );
}
