import {
  useGetDashboardSummary,
  useGetLowStockProducts,
  useGetRecentMovements,
  useGetCategoryBreakdown,
} from "@workspace/api-client-react";
import { formatCurrency } from "@/lib/format";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Package,
  AlertTriangle,
  ArrowDownToLine,
  TrendingUp,
  DollarSign,
  ShoppingCart,
  CheckCircle2,
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getStockStatusBadge, getMovementTypeBadge } from "@/lib/colors";
import { Link } from "wouter";

const CHART_COLORS = [
  "#7c3aed", "#6d28d9", "#5b21b6", "#4c1d95",
  "#8b5cf6", "#a78bfa", "#c4b5fd", "#ddd6fe",
];

function StatCard({
  title,
  value,
  sub,
  icon: Icon,
  iconBg,
  iconColor,
  borderColor,
}: {
  title: string;
  value: string | number;
  sub?: string;
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
  borderColor?: string;
}) {
  return (
    <Card className={`relative overflow-hidden${borderColor ? ` border-l-4 ${borderColor}` : ""}`}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{title}</p>
            <p className="text-2xl font-bold tracking-tight">{value}</p>
            {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
          </div>
          <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${iconBg}`}>
            <Icon className={`h-5 w-5 ${iconColor}`} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function StatCardSkeleton() {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-2 flex-1">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-7 w-32" />
            <Skeleton className="h-3 w-20" />
          </div>
          <Skeleton className="h-10 w-10 rounded-xl" />
        </div>
      </CardContent>
    </Card>
  );
}

export default function Dashboard() {
  const { data: summary, isLoading: isLoadingSummary } = useGetDashboardSummary();
  const { data: lowStock, isLoading: isLoadingLowStock } = useGetLowStockProducts();
  const { data: recentMovements, isLoading: isLoadingMovements } = useGetRecentMovements();
  const { data: categoryBreakdown } = useGetCategoryBreakdown();

  const todaySales = (summary as unknown as Record<string, number>)?.todaySales ?? 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Visão Geral</h1>
        <p className="text-muted-foreground">Acompanhe o desempenho da sua loja e status do estoque.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {isLoadingSummary ? (
          <>
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
          </>
        ) : summary ? (
          <>
            <StatCard
              title="Total de Produtos"
              value={summary.totalProducts}
              sub={`Em ${summary.totalCategories} categorias`}
              icon={Package}
              iconBg="bg-blue-100"
              iconColor="text-blue-600"
              borderColor="border-l-blue-500"
            />
            <StatCard
              title="Alerta de Estoque"
              value={summary.lowStockCount}
              sub={
                summary.outOfStockCount > 0
                  ? `${summary.outOfStockCount} produto(s) esgotado(s)`
                  : "Produtos com estoque baixo"
              }
              icon={AlertTriangle}
              iconBg={summary.lowStockCount > 0 ? "bg-amber-100" : "bg-emerald-100"}
              iconColor={summary.lowStockCount > 0 ? "text-amber-600" : "text-emerald-600"}
              borderColor={summary.lowStockCount > 0 ? "border-l-amber-500" : "border-l-emerald-500"}
            />
            <StatCard
              title="Valor em Estoque"
              value={formatCurrency(summary.totalInvested)}
              sub="Custo total do inventário"
              icon={DollarSign}
              iconBg="bg-slate-100"
              iconColor="text-slate-600"
              borderColor="border-l-slate-400"
            />
            <StatCard
              title="Lucro Estimado"
              value={formatCurrency(summary.estimatedProfit)}
              sub="Se todo estoque for vendido"
              icon={TrendingUp}
              iconBg="bg-emerald-100"
              iconColor="text-emerald-600"
              borderColor="border-l-emerald-500"
            />
          </>
        ) : null}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Distribuição por Categoria</CardTitle>
            <p className="text-xs text-muted-foreground">Valor em estoque por categoria de produto</p>
          </CardHeader>
          <CardContent className="h-[280px] pt-2">
            {categoryBreakdown && categoryBreakdown.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryBreakdown} margin={{ top: 5, right: 10, left: 10, bottom: 30 }}>
                  <XAxis
                    dataKey="categoryName"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    tick={{ fill: "#6b7280" }}
                    angle={-20}
                    textAnchor="end"
                    interval={0}
                  />
                  <YAxis
                    tickFormatter={(val) => `R$${(val / 1000).toFixed(0)}k`}
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    tick={{ fill: "#6b7280" }}
                  />
                  <Tooltip
                    formatter={(value: number) => [formatCurrency(value), "Valor em Estoque"]}
                    cursor={{ fill: "rgba(0,0,0,0.04)" }}
                    contentStyle={{
                      borderRadius: "8px",
                      border: "1px solid #e5e7eb",
                      boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.08)",
                      fontSize: "12px",
                    }}
                  />
                  <Bar dataKey="totalInvested" radius={[5, 5, 0, 0]} maxBarSize={48}>
                    {categoryBreakdown.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                Sem dados suficientes para o gráfico.
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Movimentações de Hoje</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 pt-2">
            {isLoadingSummary ? (
              <>
                <Skeleton className="h-16 w-full rounded-lg" />
                <Skeleton className="h-16 w-full rounded-lg" />
                <Skeleton className="h-16 w-full rounded-lg" />
              </>
            ) : summary ? (
              <>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-violet-50 border border-violet-100">
                  <div className="h-10 w-10 rounded-lg bg-violet-100 flex items-center justify-center">
                    <ShoppingCart className="h-5 w-5 text-violet-600" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-violet-700">Vendas Registradas</p>
                    <p className="text-xl font-bold text-violet-900">{todaySales}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 rounded-lg bg-emerald-50 border border-emerald-100">
                  <div className="h-10 w-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                    <ArrowDownToLine className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-emerald-700">Entradas de Estoque</p>
                    <p className="text-xl font-bold text-emerald-900">{summary.todayEntries}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 rounded-lg bg-blue-50 border border-blue-100">
                  <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                    <CheckCircle2 className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-blue-700">Outras Saídas</p>
                    <p className="text-xl font-bold text-blue-900">{summary.todayExits}</p>
                  </div>
                </div>
              </>
            ) : null}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle className="text-base font-semibold">Alerta de Estoque</CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">Produtos com estoque baixo ou esgotado</p>
            </div>
            <Link href="/products">
              <Button variant="outline" size="sm" className="text-xs h-7 px-3">
                Ver todos
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="pt-0">
            {isLoadingLowStock ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </div>
            ) : lowStock && lowStock.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="text-xs">Produto</TableHead>
                    <TableHead className="text-xs text-right">Estoque</TableHead>
                    <TableHead className="text-xs text-center">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lowStock.slice(0, 6).map((product) => {
                    const badge = getStockStatusBadge(product.stockStatus);
                    return (
                      <TableRow key={product.id} className="hover:bg-muted/40">
                        <TableCell className="py-2">
                          <Link href={`/products/${product.id}`} className="text-sm font-medium hover:text-primary hover:underline">
                            {product.name}
                          </Link>
                        </TableCell>
                        <TableCell className="py-2 text-right text-sm tabular-nums">
                          {product.quantity} <span className="text-muted-foreground text-xs">{product.unit}</span>
                        </TableCell>
                        <TableCell className="py-2 text-center">
                          <Badge variant="outline" className={`text-xs ${badge.className}`}>
                            {badge.label}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            ) : (
              <div className="flex flex-col items-center justify-center py-10 text-center gap-2">
                <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                </div>
                <p className="text-sm font-medium text-muted-foreground">Estoque sob controle</p>
                <p className="text-xs text-muted-foreground">Nenhum produto com estoque crítico.</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle className="text-base font-semibold">Últimas Movimentações</CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">Atividade recente no estoque</p>
            </div>
            <Link href="/movements">
              <Button variant="outline" size="sm" className="text-xs h-7 px-3">
                Ver todas
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="pt-0">
            {isLoadingMovements ? (
              <div className="space-y-2">
                {[1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </div>
            ) : recentMovements && recentMovements.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="text-xs">Produto</TableHead>
                    <TableHead className="text-xs text-center">Tipo</TableHead>
                    <TableHead className="text-xs text-right">Qtd</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentMovements.map((movement) => {
                    const badge = getMovementTypeBadge(movement.type);
                    const isPositive = movement.type === "entry";
                    return (
                      <TableRow key={movement.id} className="hover:bg-muted/40">
                        <TableCell className="py-2 text-sm font-medium truncate max-w-[160px]" title={movement.productName}>
                          {movement.productName}
                        </TableCell>
                        <TableCell className="py-2 text-center">
                          <Badge variant="outline" className={`text-xs ${badge.className}`}>
                            {badge.label}
                          </Badge>
                        </TableCell>
                        <TableCell className={`py-2 text-right text-sm font-semibold tabular-nums ${isPositive ? "text-emerald-700" : "text-slate-700"}`}>
                          {isPositive ? "+" : "-"}{movement.quantity}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            ) : (
              <div className="flex flex-col items-center justify-center py-10 text-center gap-2">
                <p className="text-sm text-muted-foreground">Nenhuma movimentação registrada ainda.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
