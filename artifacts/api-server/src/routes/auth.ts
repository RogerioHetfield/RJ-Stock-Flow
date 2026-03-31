import { Router } from "express";
import bcrypt from "bcryptjs";
import { db, usersTable } from "@workspace/db";
import { eq, count } from "drizzle-orm";
import { authMiddleware, signToken, type AuthRequest } from "../middlewares/auth.js";

const router = Router();

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

router.get("/setup", async (_req, res) => {
  const [result] = await db.select({ count: count() }).from(usersTable);
  const total = Number(result?.count || 0);
  res.json({ needsSetup: total === 0 });
});

router.post("/setup", async (req, res) => {
  const [result] = await db.select({ count: count() }).from(usersTable);
  const total = Number(result?.count || 0);

  if (total > 0) {
    res.status(400).json({ error: "bad_request", message: "O sistema já foi configurado" });
    return;
  }

  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    res.status(400).json({ error: "bad_request", message: "Nome, e-mail e senha são obrigatórios" });
    return;
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const [user] = await db
    .insert(usersTable)
    .values({ name, email, passwordHash, role: "admin", active: true })
    .returning();

  const token = signToken(user.id, user.role);
  res.status(201).json({ token, user: formatUser(user) });
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    res.status(400).json({ error: "bad_request", message: "E-mail e senha são obrigatórios" });
    return;
  }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);
  if (!user) {
    res.status(401).json({ error: "unauthorized", message: "Credenciais inválidas" });
    return;
  }

  if (!user.active) {
    res.status(403).json({ error: "forbidden", message: "Usuário desativado. Contate o administrador." });
    return;
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    res.status(401).json({ error: "unauthorized", message: "Credenciais inválidas" });
    return;
  }

  const token = signToken(user.id, user.role);
  res.json({ token, user: formatUser(user) });
});

router.get("/me", authMiddleware, async (req: AuthRequest, res) => {
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, req.userId!)).limit(1);
  if (!user) {
    res.status(401).json({ error: "unauthorized", message: "Usuário não encontrado" });
    return;
  }
  if (!user.active) {
    res.status(403).json({ error: "forbidden", message: "Usuário desativado" });
    return;
  }
  res.json(formatUser(user));
});

export default router;
