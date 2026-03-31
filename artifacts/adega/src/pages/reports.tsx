import { useState } from "react";
import { useGetStockReport, useGetFinancialReport, useGetMovementsReport } from "@workspace/api-client-react";
import { formatCurrency, formatDateTime } from "@/lib/format";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, TrendingUp, DollarSign, Package, Activity } from "lucide-react";
import { getStockStatusBadge, getMovementTypeBadge } from "@/lib/colors";
import { Badge } from "@/components/ui/badge";

export default function Reports() {
  const [activeTab, setActiveTab] = useState("stock");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Relatórios</h1>
        <p className="text-muted-foreground">Visão consolidada de dados operacionais e financeiros.</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 max-w-2xl mb-8">
          <TabsTrigger value="stock">Posição de Estoque</TabsTrigger>
          <TabsTrigger value="financial">Financeiro</TabsTrigger>
          <TabsTrigger value="movements">Movimentações</TabsTrigger>
        </TabsList>

        <TabsContent value="stock" className="space-y-6">
          <StockReportTab />
        </TabsContent>

        <TabsContent value="financial" className="space-y-6">
          <FinancialReportTab />
        </TabsContent>

        <TabsContent value="movements" className="space-y-6">
          <MovementsReportTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function StockReportTab() {
  const { data: report, isLoading } = useGetStockReport();

  if (isLoading) return <div className="flex justify-center p-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  if (!report) return null;

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total de Produtos</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{report.totalProducts}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium text-muted-foreground">Custo Total</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{formatCurrency(report.totalInvested)}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium text-muted-foreground">Venda Total</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{formatCurrency(report.totalSaleValue)}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium text-muted-foreground">Lucro Projetado</CardTitle>
            <TrendingUp className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold text-emerald-600">{formatCurrency(report.estimatedProfit)}</div></CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Detalhamento por Produto</CardTitle>
          <CardDescription>Gerado em {formatDateTime(report.generatedAt)}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border border-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Produto</TableHead>
                  <TableHead className="text-right">Qtd</TableHead>
                  <TableHead className="text-right">Custo Un.</TableHead>
                  <TableHead className="text-right">Venda Un.</TableHead>
                  <TableHead className="text-right">Total Investido</TableHead>
                  <TableHead className="text-right">Lucro Estimado</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {report.products.map(p => {
                  const badge = getStockStatusBadge(p.stockStatus);
                  return (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium">{p.name}</TableCell>
                      <TableCell className="text-right">{p.quantity}</TableCell>
                      <TableCell className="text-right text-muted-foreground">{formatCurrency(p.costPrice)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(p.salePrice)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(p.totalInvested)}</TableCell>
                      <TableCell className="text-right font-medium text-emerald-600">{formatCurrency(p.estimatedProfit)}</TableCell>
                      <TableCell className="text-center"><Badge variant="outline" className={badge.className}>{badge.label}</Badge></TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </>
  );
}

function FinancialReportTab() {
  const { data: report, isLoading } = useGetFinancialReport();

  if (isLoading) return <div className="flex justify-center p-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  if (!report) return null;

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Capital Investido</CardTitle>
          </CardHeader>
          <CardContent><div className="text-3xl font-bold">{formatCurrency(report.totalInvested)}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Retorno Potencial (Vendas)</CardTitle>
          </CardHeader>
          <CardContent><div className="text-3xl font-bold text-primary">{formatCurrency(report.totalSaleValue)}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Margem Global</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-emerald-600">{report.profitMargin}%</div>
            <p className="text-xs text-muted-foreground mt-1">Lucro bruto sobre vendas</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Produtos de Maior Valor Agregado</CardTitle>
          <CardDescription>Top itens ordenados por capital investido e margem.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border border-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Produto</TableHead>
                  <TableHead className="text-right">Capital Parado</TableHead>
                  <TableHead className="text-right">Lucro/Unidade</TableHead>
                  <TableHead className="text-right">Retorno Total Estimado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {report.products.map(p => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{p.name}</TableCell>
                    <TableCell className="text-right text-muted-foreground">{formatCurrency(p.totalInvested)}</TableCell>
                    <TableCell className="text-right font-medium">{formatCurrency(p.profitPerUnit)}</TableCell>
                    <TableCell className="text-right font-bold text-emerald-600">{formatCurrency(p.estimatedProfit)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </>
  );
}

function MovementsReportTab() {
  const { data: report, isLoading } = useGetMovementsReport();

  if (isLoading) return <div className="flex justify-center p-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  if (!report) return null;

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Entradas</CardTitle>
          </CardHeader>
          <CardContent><div className="text-2xl font-bold text-emerald-600">{report.totalEntries}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Saídas</CardTitle>
          </CardHeader>
          <CardContent><div className="text-2xl font-bold text-blue-600">{report.totalExits}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Perdas</CardTitle>
          </CardHeader>
          <CardContent><div className="text-2xl font-bold text-rose-600">{report.totalLosses}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Ajustes</CardTitle>
          </CardHeader>
          <CardContent><div className="text-2xl font-bold text-purple-600">{report.totalAdjustments}</div></CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Extrato Completo (Mês Atual)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border border-border max-h-[500px] overflow-y-auto">
            <Table>
              <TableHeader className="sticky top-0 bg-background/95 backdrop-blur z-10">
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Produto</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead className="text-right">Qtd</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {report.movements.map(m => {
                  const badge = getMovementTypeBadge(m.type);
                  return (
                    <TableRow key={m.id}>
                      <TableCell className="whitespace-nowrap">{formatDateTime(m.createdAt)}</TableCell>
                      <TableCell className="font-medium">{m.productName}</TableCell>
                      <TableCell><Badge variant="outline" className={badge.className}>{badge.label}</Badge></TableCell>
                      <TableCell className="text-right font-medium">{m.quantity}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
