import { Router } from "express";
import bcrypt from "bcryptjs";
import { db, usersTable } from "@workspace/db";
import { eq, count, and } from "drizzle-orm";
import { authMiddleware, type AuthRequest } from "../middlewares/auth.js";

const router = Router();

function adminOnly(req: AuthRequest, res: any, next: any) {
  if (req.userRole !== "admin") {
    res.status(403).json({ error: "forbidden", message: "Acesso restrito a administradores" });
    return;
  }
  next();
}

function formatUser(u: typeof usersTable.$inferSelect) {
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    active: u.active,
    createdAt: u.createdAt.toISOString(),
  };
}

router.get("/", authMiddleware, adminOnly, async (_req, res) => {
  const users = await db.select().from(usersTable).orderBy(usersTable.createdAt);
  res.json(users.map(formatUser));
});

router.post("/", authMiddleware, adminOnly, async (req: AuthRequest, res) => {
  const { name, email, password, role } = req.body;

  if (!name || !email || !password) {
    res.status(400).json({ error: "bad_request", message: "Nome, e-mail e senha são obrigatórios" });
    return;
  }

  const validRoles = ["admin", "employee"];
  if (role && !validRoles.includes(role)) {
    res.status(400).json({ error: "bad_request", message: "Perfil inválido" });
    return;
  }

  const [existing] = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);
  if (existing) {
    res.status(409).json({ error: "conflict", message: "Este e-mail já está em uso" });
    return;
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const [user] = await db
    .insert(usersTable)
    .values({ name, email, passwordHash, role: role || "employee", active: true })
    .returning();

  res.status(201).json(formatUser(user));
});

router.put("/:id", authMiddleware, adminOnly, async (req: AuthRequest, res) => {
  const id = parseInt(req.params.id);
  const { name, email, password, role, active } = req.body;

  if (email) {
    const [conflict] = await db
      .select()
      .from(usersTable)
      .where(and(eq(usersTable.email, email)))
      .limit(1);
    if (conflict && conflict.id !== id) {
      res.status(409).json({ error: "conflict", message: "Este e-mail já está em uso por outro usuário" });
      return;
    }
  }

  const updates: Partial<typeof usersTable.$inferInsert> = {};
  if (name !== undefined) updates.name = name;
  if (email !== undefined) updates.email = email;
  if (role !== undefined) updates.role = role;
  if (active !== undefined) updates.active = active;
  if (password) {
    updates.passwordHash = await bcrypt.hash(password, 12);
  }

  const [updated] = await db.update(usersTable).set(updates).where(eq(usersTable.id, id)).returning();

  if (!updated) {
    res.status(404).json({ error: "not_found", message: "Usuário não encontrado" });
    return;
  }

  res.json(formatUser(updated));
});

router.patch("/:id/status", authMiddleware, adminOnly, async (req: AuthRequest, res) => {
  const id = parseInt(req.params.id);

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, id)).limit(1);
  if (!user) {
    res.status(404).json({ error: "not_found", message: "Usuário não encontrado" });
    return;
  }

  const newActive = !user.active;

  const [updated] = await db
    .update(usersTable)
    .set({ active: newActive })
    .where(eq(usersTable.id, id))
    .returning();

  res.json(formatUser(updated));
});

router.delete("/:id", authMiddleware, adminOnly, async (req: AuthRequest, res) => {
  const id = parseInt(req.params.id);

  const [target] = await db.select().from(usersTable).where(eq(usersTable.id, id)).limit(1);
  if (!target) {
    res.status(404).json({ error: "not_found", message: "Usuário não encontrado" });
    return;
  }

  if (target.role === "admin") {
    const [adminCount] = await db
      .select({ count: count() })
      .from(usersTable)
      .where(eq(usersTable.role, "admin"));

    if (Number(adminCount?.count || 0) <= 1) {
      res.status(400).json({ error: "bad_request", message: "Não é possível excluir o único administrador do sistema" });
      return;
    }
  }

  await db.delete(usersTable).where(eq(usersTable.id, id));
  res.json({ success: true, message: "Usuário excluído com sucesso" });
});

export default router;
