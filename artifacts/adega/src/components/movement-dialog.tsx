import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useQueryClient } from "@tanstack/react-query";
import { useCreateMovement, getGetProductsQueryKey, getGetProductQueryKey, getGetMovementsQueryKey, getGetDashboardSummaryQueryKey, getGetLowStockProductsQueryKey, getGetRecentMovementsQueryKey } from "@workspace/api-client-react";
import { CreateMovementRequestType, Product } from "@workspace/api-client-react/src/generated/api.schemas";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

const movementSchema = z.object({
  type: z.enum(["entry", "exit", "loss", "adjustment"]),
  quantity: z.coerce.number().min(0.01, "A quantidade deve ser maior que 0"),
  observations: z.string().optional(),
});

type MovementFormValues = z.infer<typeof movementSchema>;

interface MovementDialogProps {
  product: Product | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultType?: CreateMovementRequestType;
}

export function MovementDialog({ product, open, onOpenChange, defaultType }: MovementDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const createMovement = useCreateMovement();

  const form = useForm<MovementFormValues>({
    resolver: zodResolver(movementSchema),
    defaultValues: {
      type: defaultType || "entry",
      quantity: 1,
      observations: "",
    },
  });

  const onSubmit = (data: MovementFormValues) => {
    if (!product) return;

    createMovement.mutate(
      {
        data: {
          productId: product.id,
          type: data.type as CreateMovementRequestType,
          quantity: data.quantity,
          observations: data.observations,
        }
      },
      {
        onSuccess: () => {
          toast({ title: "Movimentação registrada com sucesso" });
          
          // Invalidate relevant queries
          queryClient.invalidateQueries({ queryKey: getGetProductsQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetProductQueryKey(product.id) });
          queryClient.invalidateQueries({ queryKey: getGetMovementsQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetLowStockProductsQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetRecentMovementsQueryKey() });
          
          form.reset();
          onOpenChange(false);
        },
        onError: (err: any) => {
          toast({
            variant: "destructive",
            title: "Erro ao registrar movimentação",
            description: err.message || "Verifique os dados e tente novamente",
          });
        }
      }
    );
  };

  const typeLabels: Record<string, string> = {
    entry: "Entrada",
    exit: "Saída",
    loss: "Perda",
    adjustment: "Ajuste",
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Nova Movimentação</DialogTitle>
          <DialogDescription>
            Informe o tipo, quantidade e observações da movimentação.
          </DialogDescription>
        </DialogHeader>
        
        {product && (
          <div className="bg-muted p-3 rounded-md mb-4">
            <p className="text-sm font-medium">{product.name}</p>
            <p className="text-xs text-muted-foreground">Estoque atual: {product.quantity} {product.unit}</p>
          </div>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o tipo" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="entry">Entrada</SelectItem>
                      <SelectItem value="exit">Saída</SelectItem>
                      <SelectItem value="loss">Perda</SelectItem>
                      <SelectItem value="adjustment">Ajuste</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="quantity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Quantidade</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="observations"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Observações (opcional)</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Motivo da perda, ajuste, ou nota de entrada..."
                      className="resize-none"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={createMovement.isPending}>
                {createMovement.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Confirmar
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
