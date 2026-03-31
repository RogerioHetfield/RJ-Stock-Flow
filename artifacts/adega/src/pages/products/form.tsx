import { useEffect } from "react";
import { useLocation, useParams } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  useGetProduct,
  useCreateProduct,
  useUpdateProduct,
  useGetCategories,
  getGetProductsQueryKey,
  getGetProductQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Loader2, Save, Package, BarChart3, DollarSign, Truck } from "lucide-react";
import { Link } from "wouter";

const productSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  sku: z.string().optional(),
  categoryId: z.coerce.number().min(1, "Categoria é obrigatória"),
  unit: z.string().min(1, "Unidade é obrigatória"),
  quantity: z.coerce.number().min(0, "Não pode ser negativo"),
  minQuantity: z.coerce.number().min(0, "Não pode ser negativo"),
  costPrice: z.coerce.number().min(0, "Não pode ser negativo"),
  salePrice: z.coerce.number().min(0, "Não pode ser negativo"),
  supplier: z.string().optional(),
  observations: z.string().optional(),
});

type ProductFormValues = z.infer<typeof productSchema>;

const UNITS = [
  { value: "unidade", label: "Unidade (un)" },
  { value: "galão", label: "Galão" },
  { value: "botijão", label: "Botijão" },
  { value: "caixa", label: "Caixa (cx)" },
  { value: "fardo", label: "Fardo" },
  { value: "litro", label: "Litro (L)" },
  { value: "kg", label: "Quilograma (kg)" },
];

export default function ProductForm() {
  const [, setLocation] = useLocation();
  const params = useParams();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const isEdit = !!params.id && params.id !== "new";
  const productId = isEdit ? Number(params.id) : undefined;

  const { data: categories } = useGetCategories();
  const { data: product, isLoading: isProductLoading } = useGetProduct(productId as number, {
    query: { enabled: isEdit, queryKey: getGetProductQueryKey(productId as number) },
  });

  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();
  const isPending = createProduct.isPending || updateProduct.isPending;

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: "",
      sku: "",
      categoryId: 0,
      unit: "unidade",
      quantity: 0,
      minQuantity: 5,
      costPrice: 0,
      salePrice: 0,
      supplier: "",
      observations: "",
    },
  });

  const costPrice = form.watch("costPrice");
  const salePrice = form.watch("salePrice");
  const margin = costPrice > 0 ? (((salePrice - costPrice) / costPrice) * 100).toFixed(1) : null;

  useEffect(() => {
    if (isEdit && product) {
      form.reset({
        name: product.name,
        sku: product.sku || "",
        categoryId: product.categoryId,
        unit: product.unit,
        quantity: product.quantity,
        minQuantity: product.minQuantity,
        costPrice: product.costPrice,
        salePrice: product.salePrice,
        supplier: product.supplier || "",
        observations: product.observations || "",
      });
    }
  }, [isEdit, product, form]);

  const onSubmit = (data: ProductFormValues) => {
    if (isEdit && productId) {
      updateProduct.mutate(
        { id: productId, data },
        {
          onSuccess: () => {
            toast({ title: "Produto atualizado com sucesso" });
            queryClient.invalidateQueries({ queryKey: getGetProductsQueryKey() });
            queryClient.invalidateQueries({ queryKey: getGetProductQueryKey(productId) });
            setLocation(`/products/${productId}`);
          },
          onError: (err: unknown) => {
            const msg = err instanceof Error ? err.message : "Erro desconhecido";
            toast({ variant: "destructive", title: "Erro ao atualizar", description: msg });
          },
        }
      );
    } else {
      createProduct.mutate(
        { data },
        {
          onSuccess: (newProduct) => {
            toast({ title: "Produto cadastrado com sucesso" });
            queryClient.invalidateQueries({ queryKey: getGetProductsQueryKey() });
            setLocation(`/products/${newProduct.id}`);
          },
          onError: (err: unknown) => {
            const msg = err instanceof Error ? err.message : "Erro desconhecido";
            toast({ variant: "destructive", title: "Erro ao cadastrar", description: msg });
          },
        }
      );
    }
  };

  if (isEdit && isProductLoading) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto">
        <div className="flex items-center gap-4">
          <Skeleton className="h-9 w-9 rounded-md" />
          <div className="space-y-2">
            <Skeleton className="h-7 w-48" />
            <Skeleton className="h-4 w-64" />
          </div>
        </div>
        <Skeleton className="h-64 w-full rounded-xl" />
        <Skeleton className="h-48 w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-4">
        <Link href={isEdit ? `/products/${productId}` : "/products"}>
          <Button variant="outline" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {isEdit ? "Editar Produto" : "Novo Produto"}
          </h1>
          <p className="text-sm text-muted-foreground">
            {isEdit ? "Atualize as informações do produto." : "Preencha os dados para cadastrar um novo item."}
          </p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">

          <Card>
            <CardHeader className="pb-4">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-blue-100 flex items-center justify-center">
                  <Package className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <CardTitle className="text-base">Informações Básicas</CardTitle>
                  <CardDescription className="text-xs">Dados principais para identificação do produto.</CardDescription>
                </div>
              </div>
            </CardHeader>
            <Separator />
            <CardContent className="pt-5 grid grid-cols-1 md:grid-cols-2 gap-5">
              <FormField control={form.control} name="name" render={({ field }) => (
                <FormItem className="md:col-span-2">
                  <FormLabel>Nome do Produto *</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Cerveja Heineken Long Neck 330ml" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="sku" render={({ field }) => (
                <FormItem>
                  <FormLabel>SKU / Código de Barras</FormLabel>
                  <FormControl>
                    <Input placeholder="Opcional" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="categoryId" render={({ field }) => (
                <FormItem>
                  <FormLabel>Categoria *</FormLabel>
                  <Select
                    onValueChange={(val) => field.onChange(Number(val))}
                    value={field.value ? field.value.toString() : undefined}
                  >
                    <FormControl>
                      <SelectTrigger><SelectValue placeholder="Selecione uma categoria..." /></SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {categories?.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id.toString()}>{cat.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="unit" render={({ field }) => (
                <FormItem>
                  <FormLabel>Unidade de Medida *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {UNITS.map((u) => (
                        <SelectItem key={u.value} value={u.value}>{u.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-4">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-amber-100 flex items-center justify-center">
                  <BarChart3 className="h-4 w-4 text-amber-600" />
                </div>
                <div>
                  <CardTitle className="text-base">Controle de Estoque</CardTitle>
                  <CardDescription className="text-xs">Quantidades para gestão e alertas.</CardDescription>
                </div>
              </div>
            </CardHeader>
            <Separator />
            <CardContent className="pt-5 grid grid-cols-1 sm:grid-cols-2 gap-5">
              {!isEdit && (
                <FormField control={form.control} name="quantity" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Estoque Inicial</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" min="0" {...field} />
                    </FormControl>
                    <FormDescription className="text-xs">Quantidade disponível agora.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )} />
              )}

              <FormField control={form.control} name="minQuantity" render={({ field }) => (
                <FormItem>
                  <FormLabel>Estoque Mínimo *</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" min="0" {...field} />
                  </FormControl>
                  <FormDescription className="text-xs">Alerta quando atingir este valor.</FormDescription>
                  <FormMessage />
                </FormItem>
              )} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-4">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                  <DollarSign className="h-4 w-4 text-emerald-600" />
                </div>
                <div>
                  <CardTitle className="text-base">Precificação</CardTitle>
                  <CardDescription className="text-xs">Defina os preços de custo e venda.</CardDescription>
                </div>
              </div>
            </CardHeader>
            <Separator />
            <CardContent className="pt-5 grid grid-cols-1 sm:grid-cols-3 gap-5">
              <FormField control={form.control} name="costPrice" render={({ field }) => (
                <FormItem>
                  <FormLabel>Preço de Custo (R$) *</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" min="0" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="salePrice" render={({ field }) => (
                <FormItem>
                  <FormLabel>Preço de Venda (R$) *</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" min="0" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <div className="space-y-2">
                <p className="text-sm font-medium">Margem de Lucro</p>
                <div className={`h-10 flex items-center px-3 rounded-md border text-sm font-semibold ${
                  margin === null
                    ? "bg-muted/50 text-muted-foreground border-border"
                    : Number(margin) >= 0
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                    : "bg-rose-50 text-rose-700 border-rose-200"
                }`}>
                  {margin === null ? "—" : `${margin}%`}
                </div>
                <p className="text-xs text-muted-foreground">Calculado automaticamente.</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-4">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-slate-100 flex items-center justify-center">
                  <Truck className="h-4 w-4 text-slate-600" />
                </div>
                <div>
                  <CardTitle className="text-base">Fornecedor e Observações</CardTitle>
                  <CardDescription className="text-xs">Informações opcionais de suprimento.</CardDescription>
                </div>
              </div>
            </CardHeader>
            <Separator />
            <CardContent className="pt-5 grid grid-cols-1 gap-5">
              <FormField control={form.control} name="supplier" render={({ field }) => (
                <FormItem>
                  <FormLabel>Fornecedor</FormLabel>
                  <FormControl>
                    <Input placeholder="Nome do fornecedor principal" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="observations" render={({ field }) => (
                <FormItem>
                  <FormLabel>Observações</FormLabel>
                  <FormControl>
                    <Textarea
                      className="resize-none"
                      placeholder="Anotações internas sobre o produto..."
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </CardContent>
          </Card>

          <div className="flex justify-end gap-3 pb-4">
            <Link href={isEdit ? `/products/${productId}` : "/products"}>
              <Button type="button" variant="outline">Cancelar</Button>
            </Link>
            <Button type="submit" disabled={isPending}>
              {isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              {isEdit ? "Salvar Alterações" : "Cadastrar Produto"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
