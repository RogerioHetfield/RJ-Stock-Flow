import { Router } from "express";
import { db, productsTable, categoriesTable, movementsTable } from "@workspace/db";
import { eq, count, gte } from "drizzle-orm";
import { authMiddleware } from "../middlewares/auth.js";

const router = Router();

function toNumber(val: string | null | undefined): number {
  return val ? parseFloat(val) : 0;
}

router.get("/summary", authMiddleware, async (_req, res) => {
  const products = await db.select().from(productsTable);
  const [catCount] = await db.select({ count: count() }).from(categoriesTable);

  let totalInvested = 0;
  let totalSaleValue = 0;
  let estimatedProfit = 0;
  let lowStockCount = 0;
  let outOfStockCount = 0;

  for (const p of products) {
    const qty = toNumber(p.quantity);
    const min = toNumber(p.minQuantity);
    const cost = toNumber(p.costPrice);
    const sale = toNumber(p.salePrice);
    totalInvested += qty * cost;
    totalSaleValue += qty * sale;
    estimatedProfit += qty * (sale - cost);
    if (qty <= 0) outOfStockCount++;
    else if (qty <= min) lowStockCount++;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const todayMovements = await db
    .select({ type: movementsTable.type, quantity: movementsTable.quantity })
    .from(movementsTable)
    .where(gte(movementsTable.createdAt, today));

  const todayEntries = todayMovements.filter((m) => m.type === "entry").length;
  const todayExits = todayMovements.filter((m) => m.type === "exit" || m.type === "loss").length;
  const todaySales = todayMovements.filter((m) => m.type === "sale").length;
  const todaySalesQty = todayMovements
    .filter((m) => m.type === "sale")
    .reduce((acc, m) => acc + toNumber(m.quantity), 0);

  res.json({
    totalProducts: products.length,
    totalCategories: Number(catCount?.count || 0),
    lowStockCount,
    outOfStockCount,
    totalInvested,
    totalSaleValue,
    estimatedProfit,
    todayEntries,
    todayExits,
    todaySales,
    todaySalesQty,
  });
});

router.get("/low-stock", authMiddleware, async (_req, res) => {
  const products = await db
    .select({ product: productsTable, categoryName: categoriesTable.name })
    .from(productsTable)
    .leftJoin(categoriesTable, eq(productsTable.categoryId, categoriesTable.id));

  const lowStock = products.filter((r) => {
    const qty = toNumber(r.product.quantity);
    const min = toNumber(r.product.minQuantity);
    return qty <= min;
  });

  res.json(
    lowStock.map((r) => {
      const qty = toNumber(r.product.quantity);
      const min = toNumber(r.product.minQuantity);
      const cost = toNumber(r.product.costPrice);
      const sale = toNumber(r.product.salePrice);
      return {
        id: r.product.id,
        name: r.product.name,
        sku: r.product.sku,
        description: r.product.description,
        categoryId: r.product.categoryId,
        categoryName: r.categoryName,
        unit: r.product.unit,
        quantity: qty,
        minQuantity: min,
        costPrice: cost,
        salePrice: sale,
        supplier: r.product.supplier,
        expiryDate: r.product.expiryDate?.toISOString() || null,
        entryDate: r.product.entryDate?.toISOString() || null,
        observations: r.product.observations,
        imageUrl: r.product.imageUrl,
        profitPerUnit: sale - cost,
        totalInvested: qty * cost,
        totalSaleValue: qty * sale,
        estimatedProfit: qty * (sale - cost),
        stockStatus: qty <= 0 ? "out" : "low",
        createdAt: r.product.createdAt.toISOString(),
      };
    })
  );
});

router.get("/recent-movements", authMiddleware, async (req, res) => {
  const limit = parseInt(String(req.query.limit || "10"));
  const { usersTable } = await import("@workspace/db");
  const { desc } = await import("drizzle-orm");

  const rows = await db
    .select({
      m: movementsTable,
      productName: productsTable.name,
      productSku: productsTable.sku,
      categoryName: categoriesTable.name,
      userName: usersTable.name,
    })
    .from(movementsTable)
    .leftJoin(productsTable, eq(movementsTable.productId, productsTable.id))
    .leftJoin(categoriesTable, eq(productsTable.categoryId, categoriesTable.id))
    .leftJoin(usersTable, eq(movementsTable.userId, usersTable.id))
    .orderBy(desc(movementsTable.createdAt))
    .limit(limit);

  res.json(
    rows.map((r) => ({
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
      paymentMethod: r.m.paymentMethod,
      observations: r.m.observations,
      createdAt: r.m.createdAt.toISOString(),
    }))
  );
});

router.get("/category-breakdown", authMiddleware, async (_req, res) => {
  const products = await db
    .select({ product: productsTable, categoryName: categoriesTable.name })
    .from(productsTable)
    .leftJoin(categoriesTable, eq(productsTable.categoryId, categoriesTable.id));

  const byCategory = new Map<
    number,
    { categoryName: string; productCount: number; totalQuantity: number; totalInvested: number; estimatedProfit: number }
  >();

  for (const r of products) {
    const catId = r.product.categoryId;
    const catName = r.categoryName || "Sem categoria";
    const qty = toNumber(r.product.quantity);
    const cost = toNumber(r.product.costPrice);
    const sale = toNumber(r.product.salePrice);

    if (!byCategory.has(catId)) {
      byCategory.set(catId, { categoryName: catName, productCount: 0, totalQuantity: 0, totalInvested: 0, estimatedProfit: 0 });
    }

    const entry = byCategory.get(catId)!;
    entry.productCount++;
    entry.totalQuantity += qty;
    entry.totalInvested += qty * cost;
    entry.estimatedProfit += qty * (sale - cost);
  }

  res.json(
    Array.from(byCategory.entries()).map(([categoryId, data]) => ({
      categoryId,
      ...data,
    }))
  );
});

export default router;
