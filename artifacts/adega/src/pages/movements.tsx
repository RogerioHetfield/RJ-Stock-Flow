import { useState } from "react";
import { Link } from "wouter";
import { useGetMovements, useGetCategories } from "@workspace/api-client-react";
import { GetMovementsType } from "@workspace/api-client-react/src/generated/api.schemas";
import { formatDateTime } from "@/lib/format";
import { getMovementTypeBadge, getCategoryColor } from "@/lib/colors";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FilterX, Loader2 } from "lucide-react";

export default function MovementsList() {
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [categoryId, setCategoryId] = useState<string>("all");

  const { data: categories } = useGetCategories();
  
  const queryParams = {
    type: typeFilter !== "all" ? typeFilter as GetMovementsType : undefined,
    categoryId: categoryId !== "all" ? Number(categoryId) : undefined,
  };
  
  const { data: movements, isLoading } = useGetMovements(queryParams);

  const clearFilters = () => {
    setTypeFilter("all");
    setCategoryId("all");
  };

  const typeOptions = [
    { value: "entry", label: "Entradas" },
    { value: "exit", label: "Saídas" },
    { value: "loss", label: "Perdas" },
    { value: "adjustment", label: "Ajustes" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Histórico de Movimentações</h1>
        <p className="text-muted-foreground">Registro completo de todas as entradas e saídas do estoque.</p>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row gap-4 items-center">
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full sm:max-w-[200px]">
                <SelectValue placeholder="Tipo de Movimento" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os tipos</SelectItem>
                {typeOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={categoryId} onValueChange={setCategoryId}>
              <SelectTrigger className="w-full sm:max-w-[200px]">
                <SelectValue placeholder="Categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas categorias</SelectItem>
                {categories?.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id.toString()}>{cat.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {(typeFilter !== "all" || categoryId !== "all") && (
              <Button variant="ghost" onClick={clearFilters} className="px-2 lg:px-4">
                <FilterX className="h-4 w-4 lg:mr-2" />
                <span className="hidden lg:inline">Limpar Filtros</span>
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border border-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data / Hora</TableHead>
                  <TableHead>Produto</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead className="text-right">Quantidade</TableHead>
                  <TableHead>Usuário</TableHead>
                  <TableHead>Observações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center">
                      <div className="flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
                    </TableCell>
                  </TableRow>
                ) : movements && movements.length > 0 ? (
                  movements.map((mov) => {
                    const badge = getMovementTypeBadge(mov.type);
                    const isPositive = mov.type === 'entry' || (mov.type === 'adjustment' && mov.quantity > 0);
                    
                    return (
                      <TableRow key={mov.id}>
                        <TableCell className="whitespace-nowrap">{formatDateTime(mov.createdAt)}</TableCell>
                        <TableCell className="font-medium">
                          <Link href={`/products/${mov.productId}`} className="hover:underline text-primary">
                            {mov.productName}
                          </Link>
                          {mov.productSku && <div className="text-xs text-muted-foreground">{mov.productSku}</div>}
                        </TableCell>
                        <TableCell>
                          {mov.categoryName && (
                            <Badge variant="outline" className={`font-normal bg-slate-50`}>
                              {mov.categoryName}
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={badge.className}>{badge.label}</Badge>
                        </TableCell>
                        <TableCell className={`text-right font-medium ${isPositive ? 'text-emerald-600' : 'text-rose-600'}`}>
                          {isPositive ? '+' : ''}{mov.quantity}
                        </TableCell>
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
                      Nenhuma movimentação encontrada.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
