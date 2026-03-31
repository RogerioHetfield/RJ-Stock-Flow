import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useQueryClient } from "@tanstack/react-query";
import {
  useCreateMovement,
  getGetProductsQueryKey,
  getGetProductQueryKey,
  getGetMovementsQueryKey,
  getGetDashboardSummaryQueryKey,
  getGetLowStockProductsQueryKey,
  getGetRecentMovementsQueryKey,
} from "@workspace/api-client-react";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ShoppingCart, Package } from "lucide-react";
import { formatCurrency } from "@/lib/format";

const saleSchema = z.object({
  quantity: z.coerce.number().min(0.01, "Quantidade deve ser maior que 0"),
  paymentMethod: z.string().min(1, "Forma de pagamento é obrigatória"),
  observations: z.string().optional(),
});

type SaleFormValues = z.infer<typeof saleSchema>;

const PAYMENT_METHODS = [
  { value: "dinheiro", label: "Dinheiro" },
  { value: "pix", label: "PIX" },
  { value: "debito", label: "Cartão de Débito" },
  { value: "credito", label: "Cartão de Crédito" },
  { value: "fiado", label: "Fiado" },
];

type SaleProduct = {
  id: number;
  name: string;
  sku?: string | null;
  unit: string;
  quantity: number;
  salePrice: number;
  stockStatus: string;
};

interface SaleDialogProps {
  product: SaleProduct | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SaleDialog({ product, open, onOpenChange }: SaleDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const createMovement = useCreateMovement();

  const form = useForm<SaleFormValues>({
    resolver: zodResolver(saleSchema),
    defaultValues: {
      quantity: 1,
      paymentMethod: "",
      observations: "",
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({ quantity: 1, paymentMethod: "", observations: "" });
    }
  }, [open, form]);

  const qty = form.watch("quantity");
  const totalValue = product ? (qty || 0) * product.salePrice : 0;

  const onSubmit = (data: SaleFormValues) => {
    if (!product) return;

    createMovement.mutate(
      {
        data: {
          productId: product.id,
          type: "sale" as never,
          quantity: data.quantity,
          paymentMethod: data.paymentMethod as never,
          observations: data.observations || undefined,
        },
      },
      {
        onSuccess: () => {
          const paymentLabel = PAYMENT_METHODS.find((p) => p.value === data.paymentMethod)?.label || data.paymentMethod;
          toast({
            title: "Venda registrada com sucesso",
            description: `${data.quantity} ${product.unit} de ${product.name} — ${paymentLabel}`,
          });
          queryClient.invalidateQueries({ queryKey: getGetProductsQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetProductQueryKey(product.id) });
          queryClient.invalidateQueries({ queryKey: getGetMovementsQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetLowStockProductsQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetRecentMovementsQueryKey() });
          onOpenChange(false);
        },
        onError: (err: unknown) => {
          const msg = err instanceof Error ? err.message : "Verifique os dados e tente novamente";
          toast({ variant: "destructive", title: "Erro ao registrar venda", description: msg });
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[460px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5 text-violet-600" />
            Registrar Venda
          </DialogTitle>
          <DialogDescription>
            Informe a quantidade vendida e a forma de pagamento.
          </DialogDescription>
        </DialogHeader>

        {product && (
          <div className="rounded-lg border border-border bg-muted/40 p-4 space-y-2">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="h-9 w-9 rounded-md bg-violet-100 flex items-center justify-center flex-shrink-0">
                  <Package className="h-4 w-4 text-violet-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold leading-tight">{product.name}</p>
                  {product.sku && <p className="text-xs text-muted-foreground">SKU: {product.sku}</p>}
                </div>
              </div>
              <Badge variant="outline" className="text-xs font-normal shrink-0">
                {product.quantity} {product.unit} disponível
              </Badge>
            </div>
            <div className="flex items-center justify-between pt-1 border-t border-border/50">
              <span className="text-xs text-muted-foreground">Preço unitário</span>
              <span className="text-sm font-semibold text-emerald-700">{formatCurrency(product.salePrice)}</span>
            </div>
          </div>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="quantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quantidade</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" min="0.01" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="space-y-2">
                <p className="text-sm font-medium leading-none">Total da Venda</p>
                <div className="h-10 flex items-center px-3 rounded-md border border-border bg-muted/50">
                  <span className="text-sm font-bold text-emerald-700">{formatCurrency(totalValue)}</span>
                </div>
              </div>
            </div>

            <FormField
              control={form.control}
              name="paymentMethod"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Forma de Pagamento *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione..." />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {PAYMENT_METHODS.map((pm) => (
                        <SelectItem key={pm.value} value={pm.value}>
                          {pm.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="observations"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Observação (opcional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Cliente, referência de nota, etc."
                      className="resize-none"
                      rows={2}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={createMovement.isPending}
                className="bg-violet-600 hover:bg-violet-700 text-white"
              >
                {createMovement.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <ShoppingCart className="mr-2 h-4 w-4" />
                )}
                Confirmar Venda
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
