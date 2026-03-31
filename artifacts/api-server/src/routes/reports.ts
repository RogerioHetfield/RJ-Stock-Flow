import { Router } from "express";
import { db, productsTable, categoriesTable, movementsTable, usersTable } from "@workspace/db";
import { eq, and, gte, lte, SQL, desc } from "drizzle-orm";
import { authMiddleware } from "../middlewares/auth.js";

const router = Router();

function toNumber(val: string | null | undefined): number {
  return val ? parseFloat(val) : 0;
}

function getStockStatus(qty: number, min: number): "ok" | "low" | "out" {
  if (qty <= 0) return "out";
  if (qty <= min) return "low";
  return "ok";
}

function formatProduct(p: any, categoryName?: string | null) {
  const qty = toNumber(p.quantity);
  const min = toNumber(p.minQuantity);
  const cost = toNumber(p.costPrice);
  const sale = toNumber(p.salePrice);
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
    profitPerUnit: sale - cost,
    totalInvested: qty * cost,
    totalSaleValue: qty * sale,
    estimatedProfit: qty * (sale - cost),
    stockStatus: getStockStatus(qty, min),
    createdAt: p.createdAt.toISOString(),
  };
}

router.get("/stock", authMiddleware, async (req, res) => {
  const { categoryId, status } = req.query as Record<string, string>;

  const conditions: SQL[] = [];
  if (categoryId) conditions.push(eq(productsTable.categoryId, parseInt(categoryId)));

  const rows = await db
    .select({ product: productsTable, categoryName: categoriesTable.name })
    .from(productsTable)
    .leftJoin(categoriesTable, eq(productsTable.categoryId, categoriesTable.id))
    .where(conditions.length > 0 ? and(...conditions) : undefined);

  let products = rows.map((r) => formatProduct(r.product, r.categoryName));

  if (status === "low") products = products.filter((p) => p.stockStatus === "low");
  if (status === "out") products = products.filter((p) => p.stockStatus === "out");

  const totalInvested = products.reduce((a, p) => a + p.totalInvested, 0);
  const totalSaleValue = products.reduce((a, p) => a + p.totalSaleValue, 0);
  const estimatedProfit = products.reduce((a, p) => a + p.estimatedProfit, 0);

  res.json({
    generatedAt: new Date().toISOString(),
    totalProducts: products.length,
    totalInvested,
    totalSaleValue,
    estimatedProfit,
    products,
  });
});

router.get("/financial", authMiddleware, async (req, res) => {
  const { startDate, endDate, categoryId } = req.query as Record<string, string>;

  const conditions: SQL[] = [];
  if (categoryId) conditions.push(eq(productsTable.categoryId, parseInt(categoryId)));

  const rows = await db
    .select({ product: productsTable, categoryName: categoriesTable.name })
    .from(productsTable)
    .leftJoin(categoriesTable, eq(productsTable.categoryId, categoriesTable.id))
    .where(conditions.length > 0 ? and(...conditions) : undefined);

  const products = rows.map((r) => formatProduct(r.product, r.categoryName));
  const totalInvested = products.reduce((a, p) => a + p.totalInvested, 0);
  const totalSaleValue = products.reduce((a, p) => a + p.totalSaleValue, 0);
  const estimatedProfit = products.reduce((a, p) => a + p.estimatedProfit, 0);
  const profitMargin = totalSaleValue > 0 ? (estimatedProfit / totalSaleValue) * 100 : 0;

  res.json({
    generatedAt: new Date().toISOString(),
    period: {
      startDate: startDate || new Date(0).toISOString(),
      endDate: endDate || new Date().toISOString(),
    },
    totalInvested,
    totalSaleValue,
    estimatedProfit,
    profitMargin,
    products,
  });
});

router.get("/movements", authMiddleware, async (req, res) => {
  const { type, startDate, endDate, categoryId } = req.query as Record<string, string>;

  const conditions: SQL[] = [];
  if (type) conditions.push(eq(movementsTable.type, type));
  if (startDate) conditions.push(gte(movementsTable.createdAt, new Date(startDate)));
  if (endDate) conditions.push(lte(movementsTable.createdAt, new Date(endDate)));

  const rows = await db
    .select({
      m: movementsTable,
      productName: productsTable.name,
      productSku: productsTable.sku,
      productCategoryId: productsTable.categoryId,
      categoryName: categoriesTable.name,
      userName: usersTable.name,
    })
    .from(movementsTable)
    .leftJoin(productsTable, eq(movementsTable.productId, productsTable.id))
    .leftJoin(categoriesTable, eq(productsTable.categoryId, categoriesTable.id))
    .leftJoin(usersTable, eq(movementsTable.userId, usersTable.id))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(movementsTable.createdAt));

  let movements = rows.map((r) => ({
    id: r.m.id,
    productId: r.m.productId,
    productName: r.productName || "Produto removido",
    productSku: r.productSku,
    categoryName: r.categoryName,
    type: r.m.type,
    quantity: toNumber(r.m.quantity),
    previousQuantity: toNumber(r.m.previousQuantity),
    newQuantity: toNumber(r.m.newQuantity),
    userId: r.m.userId,
    userName: r.userName || "Sistema",
    observations: r.m.observations,
    createdAt: r.m.createdAt.toISOString(),
  }));

  if (categoryId) {
    const catId = parseInt(categoryId);
    const productIds = await db
      .select({ id: productsTable.id })
      .from(productsTable)
      .where(eq(productsTable.categoryId, catId));
    const ids = new Set(productIds.map((p) => p.id));
    movements = movements.filter((m) => ids.has(m.productId));
  }

  const totalEntries = movements.filter((m) => m.type === "entry").length;
  const totalExits = movements.filter((m) => m.type === "exit").length;
  const totalLosses = movements.filter((m) => m.type === "loss").length;
  const totalAdjustments = movements.filter((m) => m.type === "adjustment").length;

  const now = new Date().toISOString();
  res.json({
    generatedAt: now,
    period: {
      startDate: startDate || new Date(0).toISOString(),
      endDate: endDate || now,
    },
    totalEntries,
    totalExits,
    totalLosses,
    totalAdjustments,
    movements,
  });
});

export default router;
