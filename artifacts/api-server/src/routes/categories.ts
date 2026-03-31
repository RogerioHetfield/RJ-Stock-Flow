import { Router } from "express";
import { db, categoriesTable, productsTable } from "@workspace/db";
import { eq, count } from "drizzle-orm";
import { authMiddleware } from "../middlewares/auth.js";

const router = Router();

router.get("/", authMiddleware, async (_req, res) => {
  const categories = await db.select().from(categoriesTable).orderBy(categoriesTable.name);
  const counts = await db
    .select({ categoryId: productsTable.categoryId, count: count() })
    .from(productsTable)
    .groupBy(productsTable.categoryId);

  const countMap = new Map(counts.map((c) => [c.categoryId, Number(c.count)]));

  res.json(
    categories.map((c) => ({
      id: c.id,
      name: c.name,
      description: c.description,
      productCount: countMap.get(c.id) || 0,
      createdAt: c.createdAt.toISOString(),
    }))
  );
});

router.post("/", authMiddleware, async (req, res) => {
  const { name, description } = req.body;
  if (!name) {
    res.status(400).json({ error: "bad_request", message: "Nome é obrigatório" });
    return;
  }

  const [category] = await db
    .insert(categoriesTable)
    .values({ name, description })
    .returning();

  res.status(201).json({
    id: category.id,
    name: category.name,
    description: category.description,
    productCount: 0,
    createdAt: category.createdAt.toISOString(),
  });
});

router.put("/:id", authMiddleware, async (req, res) => {
  const id = parseInt(req.params.id);
  const { name, description } = req.body;
  if (!name) {
    res.status(400).json({ error: "bad_request", message: "Nome é obrigatório" });
    return;
  }

  const [updated] = await db
    .update(categoriesTable)
    .set({ name, description })
    .where(eq(categoriesTable.id, id))
    .returning();

  if (!updated) {
    res.status(404).json({ error: "not_found", message: "Categoria não encontrada" });
    return;
  }

  const [countResult] = await db
    .select({ count: count() })
    .from(productsTable)
    .where(eq(productsTable.categoryId, id));

  res.json({
    id: updated.id,
    name: updated.name,
    description: updated.description,
    productCount: Number(countResult?.count || 0),
    createdAt: updated.createdAt.toISOString(),
  });
});

router.delete("/:id", authMiddleware, async (req, res) => {
  const id = parseInt(req.params.id);
  await db.delete(categoriesTable).where(eq(categoriesTable.id, id));
  res.json({ success: true, message: "Categoria excluída com sucesso" });
});

export default router;
