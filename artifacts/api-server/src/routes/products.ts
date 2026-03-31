import { Router } from "express";
import { db, productsTable, categoriesTable, movementsTable } from "@workspace/db";
import { eq, ilike, and, lte, SQL, asc, desc } from "drizzle-orm";
import { authMiddleware, type AuthRequest } from "../middlewares/auth.js";

const router = Router();

function toNumber(val: string | null | undefined): number {
  return val ? parseFloat(val) : 0;
}

function getStockStatus(qty: number, min: number): "ok" | "low" | "out" {
  if (qty <= 0) return "out";
  if (qty <= min) return "low";
  return "ok";
}

function formatProduct(p: {
  id: number;
  name: string;
  sku: string | null;
  description: string | null;
  categoryId: number;
  unit: string;
  quantity: string;
  minQuantity: string;
  costPrice: string;
  salePrice: string;
  supplier: string | null;
  expiryDate: Date | null;
  entryDate: Date | null;
  observations: string | null;
  imageUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
}, categoryName?: string) {
  const qty = toNumber(p.quantity);
  const min = toNumber(p.minQuantity);
  const cost = toNumber(p.costPrice);
  const sale = toNumber(p.salePrice);
  const profitPerUnit = sale - cost;
  const totalInvested = qty * cost;
  const totalSaleValue = qty * sale;
  const estimatedProfit = qty * profitPerUnit;

  return {
    id: p.id,
    name: p.name,
    sku: p.sku,
    description: p.description,
    categoryId: p.categoryId,
    categoryName: categoryName || null,
    unit: p.unit,
    quantity: qty,
    minQuantity: min,
    costPrice: cost,
    salePrice: sale,
    supplier: p.supplier,
    expiryDate: p.expiryDate?.toISOString() || null,
    entryDate: p.entryDate?.toISOString() || null,
    observations: p.observations,
    imageUrl: p.imageUrl,
    profitPerUnit,
    totalInvested,
    totalSaleValue,
    estimatedProfit,
    stockStatus: getStockStatus(qty, min),
    createdAt: p.createdAt.toISOString(),
  };
}

router.get("/", authMiddleware, async (req, res) => {
  const { search, categoryId, lowStock, outOfStock, sortBy, sortOrder } = req.query as Record<string, string>;

  const conditions: SQL[] = [];
  if (search) conditions.push(ilike(productsTable.name, `%${search}%`));
  if (categoryId) conditions.push(eq(productsTable.categoryId, parseInt(categoryId)));

  const products = await db
    .select({
      product: productsTable,
      categoryName: categoriesTable.name,
    })
    .from(productsTable)
    .leftJoin(categoriesTable, eq(productsTable.categoryId, categoriesTable.id))
    .where(conditions.length > 0 ? and(...conditions) : undefined);

  let result = products.map((r) => formatProduct(r.product, r.categoryName || undefined));

  if (lowStock === "true") result = result.filter((p) => p.stockStatus === "low");
  if (outOfStock === "true") result = result.filter((p) => p.stockStatus === "out");

  if (sortBy) {
    const dir = sortOrder === "desc" ? -1 : 1;
    result.sort((a, b) => {
      const map: Record<string, number> = {
        name: a.name.localeCompare(b.name) * dir,
        quantity: (a.quantity - b.quantity) * dir,
        cost: (a.costPrice - b.costPrice) * dir,
        price: (a.salePrice - b.salePrice) * dir,
        profit: (a.profitPerUnit - b.profitPerUnit) * dir,
      };
      return map[sortBy] || 0;
    });
  }

  res.json(result);
});

router.post("/", authMiddleware, async (req: AuthRequest, res) => {
  const {
    name, sku, description, categoryId, unit, quantity, minQuantity,
    costPrice, salePrice, supplier, expiryDate, entryDate, observations, imageUrl,
  } = req.body;

  if (!name || !categoryId || !unit) {
    res.status(400).json({ error: "bad_request", message: "Campos obrigatórios ausentes" });
    return;
  }

  const [product] = await db
    .insert(productsTable)
    .values({
      name,
      sku,
      description,
      categoryId: parseInt(categoryId),
      unit,
      quantity: String(quantity || 0),
      minQuantity: String(minQuantity || 5),
      costPrice: String(costPrice || 0),
      salePrice: String(salePrice || 0),
      supplier,
      expiryDate: expiryDate ? new Date(expiryDate) : null,
      entryDate: entryDate ? new Date(entryDate) : null,
      observations,
      imageUrl,
    })
    .returning();

  if (Number(quantity) > 0) {
    await db.insert(movementsTable).values({
      productId: product.id,
      type: "entry",
      quantity: String(quantity),
      previousQuantity: "0",
      newQuantity: String(quantity),
      userId: req.userId!,
      observations: "Estoque inicial",
    });
  }

  const [cat] = await db.select().from(categoriesTable).where(eq(categoriesTable.id, parseInt(categoryId))).limit(1);
  res.status(201).json(formatProduct(product, cat?.name));
});

router.get("/:id", authMiddleware, async (req, res) => {
  const id = parseInt(req.params.id);

  const [row] = await db
    .select({ product: productsTable, categoryName: categoriesTable.name })
    .from(productsTable)
    .leftJoin(categoriesTable, eq(productsTable.categoryId, categoriesTable.id))
    .where(eq(productsTable.id, id))
    .limit(1);

  if (!row) {
    res.status(404).json({ error: "not_found", message: "Produto não encontrado" });
    return;
  }

  const movs = await db
    .select({
      movement: movementsTable,
      userName: db.$with("u").as(db.select().from(movementsTable))._.config.fields,
    })
    .from(movementsTable)
    .where(eq(movementsTable.productId, id))
    .orderBy(desc(movementsTable.createdAt))
    .limit(50);

  const { usersTable } = await import("@workspace/db");
  const rawMovs = await db
    .select({ m: movementsTable, userName: usersTable.name })
    .from(movementsTable)
    .leftJoin(usersTable, eq(movementsTable.userId, usersTable.id))
    .where(eq(movementsTable.productId, id))
    .orderBy(desc(movementsTable.createdAt))
    .limit(50);

  const movements = rawMovs.map((r) => ({
    id: r.m.id,
    productId: r.m.productId,
    productName: row.product.name,
    productSku: row.product.sku,
    categoryName: row.categoryName,
    type: r.m.type,
    quantity: toNumber(r.m.quantity),
    previousQuantity: toNumber(r.m.previousQuantity),
    newQuantity: toNumber(r.m.newQuantity),
    userId: r.m.userId,
    userName: r.userName || "Sistema",
    observations: r.m.observations,
    createdAt: r.m.createdAt.toISOString(),
  }));

  res.json({ ...formatProduct(row.product, row.categoryName || undefined), movements });
});

router.put("/:id", authMiddleware, async (req, res) => {
  const id = parseInt(req.params.id);
  const {
    name, sku, description, categoryId, unit, quantity, minQuantity,
    costPrice, salePrice, supplier, expiryDate, entryDate, observations, imageUrl,
  } = req.body;

  const [updated] = await db
    .update(productsTable)
    .set({
      name,
      sku,
      description,
      categoryId: categoryId ? parseInt(categoryId) : undefined,
      unit,
      quantity: quantity !== undefined ? String(quantity) : undefined,
      minQuantity: minQuantity !== undefined ? String(minQuantity) : undefined,
      costPrice: costPrice !== undefined ? String(costPrice) : undefined,
      salePrice: salePrice !== undefined ? String(salePrice) : undefined,
      supplier,
      expiryDate: expiryDate ? new Date(expiryDate) : null,
      entryDate: entryDate ? new Date(entryDate) : null,
      observations,
      imageUrl,
    })
    .where(eq(productsTable.id, id))
    .returning();

  if (!updated) {
    res.status(404).json({ error: "not_found", message: "Produto não encontrado" });
    return;
  }

  const [cat] = await db.select().from(categoriesTable).where(eq(categoriesTable.id, updated.categoryId)).limit(1);
  res.json(formatProduct(updated, cat?.name));
});

router.delete("/:id", authMiddleware, async (req, res) => {
  const id = parseInt(req.params.id);
  await db.delete(movementsTable).where(eq(movementsTable.productId, id));
  await db.delete(productsTable).where(eq(productsTable.id, id));
  res.json({ success: true, message: "Produto excluído com sucesso" });
});

export { toNumber, getStockStatus, formatProduct };
export default router;
