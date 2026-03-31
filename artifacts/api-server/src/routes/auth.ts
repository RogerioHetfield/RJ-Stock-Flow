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
  try {
    console.log("1 - entrou no login");

    const { email, password } = req.body;
    console.log("2 - body recebido", { email, hasPassword: !!password });

    if (!email || !password) {
      res.status(400).json({ error: "bad_request", message: "E-mail e senha são obrigatórios" });
      return;
    }

    console.log("3 - antes da query no banco");

    const [user] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.email, email))
      .limit(1);

    console.log("4 - depois da query", user?.email);

    if (!user) {
      res.status(401).json({ error: "unauthorized", message: "Credenciais inválidas" });
      return;
    }

    if (!user.active) {
      res.status(403).json({ error: "forbidden", message: "Usuário desativado. Contate o administrador." });
      return;
    }

    console.log("5 - antes do bcrypt.compare");

    const valid = await bcrypt.compare(password, user.passwordHash);

    console.log("6 - depois do bcrypt.compare", valid);

    if (!valid) {
      res.status(401).json({ error: "unauthorized", message: "Credenciais inválidas" });
      return;
    }

    const token = signToken(user.id, user.role);

    console.log("7 - antes de responder");

    res.json({ token, user: formatUser(user) });

  } catch (error) {
    console.error("Erro no login:", error);
    res.status(500).json({ error: "internal_error", message: "Erro interno no login" });
  }
});

export default router;
