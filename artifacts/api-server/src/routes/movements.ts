import { Router } from "express";
import { db, movementsTable, productsTable, categoriesTable, usersTable } from "@workspace/db";
import { eq, and, gte, lte, SQL, desc } from "drizzle-orm";
import { authMiddleware, type AuthRequest } from "../middlewares/auth.js";

const router = Router();

function toNumber(val: string | null | undefined): number {
  return val ? parseFloat(val) : 0;
}

router.get("/", authMiddleware, async (req, res) => {
  const { productId, type, startDate, endDate, categoryId } = req.query as Record<string, string>;

  const conditions: SQL[] = [];
  if (productId) conditions.push(eq(movementsTable.productId, parseInt(productId)));
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

  let result = rows.map((r) => ({
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
  }));

  if (categoryId) {
    const catId = parseInt(categoryId);
    const productIds = await db
      .select({ id: productsTable.id })
      .from(productsTable)
      .where(eq(productsTable.categoryId, catId));
    const ids = new Set(productIds.map((p) => p.id));
    result = result.filter((r) => ids.has(r.productId));
  }

  res.json(result);
});

router.post("/", authMiddleware, async (req: AuthRequest, res) => {
  const { productId, type, quantity, paymentMethod, observations } = req.body;

  if (!productId || !type || !quantity) {
    res.status(400).json({ error: "bad_request", message: "Campos obrigatórios ausentes" });
    return;
  }

  const validTypes = ["entry", "exit", "loss", "adjustment", "sale"];
  if (!validTypes.includes(type)) {
    res.status(400).json({ error: "bad_request", message: "Tipo de movimentação inválido" });
    return;
  }

  const [product] = await db
    .select()
    .from(productsTable)
    .where(eq(productsTable.id, parseInt(productId)))
    .limit(1);

  if (!product) {
    res.status(404).json({ error: "not_found", message: "Produto não encontrado" });
    return;
  }

  const previousQty = toNumber(product.quantity);
  const qty = parseFloat(String(quantity));

  let newQty: number;
  if (type === "entry") {
    newQty = previousQty + qty;
  } else if (type === "exit" || type === "loss" || type === "sale") {
    newQty = Math.max(0, previousQty - qty);
  } else {
    newQty = qty;
  }

  await db
    .update(productsTable)
    .set({ quantity: String(newQty) })
    .where(eq(productsTable.id, parseInt(productId)));

  const [movement] = await db
    .insert(movementsTable)
    .values({
      productId: parseInt(productId),
      type,
      quantity: String(qty),
      previousQuantity: String(previousQty),
      newQuantity: String(newQty),
      userId: req.userId!,
      paymentMethod: paymentMethod || null,
      observations,
    })
    .returning();

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, req.userId!)).limit(1);

  res.status(201).json({
    id: movement.id,
    productId: movement.productId,
    productName: product.name,
    productSku: product.sku,
    categoryName: null,
    type: movement.type,
    quantity: toNumber(movement.quantity),
    previousQuantity: toNumber(movement.previousQuantity),
    newQuantity: toNumber(movement.newQuantity),
    userId: movement.userId,
    userName: user?.name || "Sistema",
    paymentMethod: movement.paymentMethod,
    observations: movement.observations,
    createdAt: movement.createdAt.toISOString(),
  });
});

export default router;
