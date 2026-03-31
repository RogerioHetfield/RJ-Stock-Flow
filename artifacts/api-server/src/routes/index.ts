import { Router, type IRouter } from "express";
import healthRouter from "./health.js";
import authRouter from "./auth.js";
import categoriesRouter from "./categories.js";
import productsRouter from "./products.js";
import movementsRouter from "./movements.js";
import dashboardRouter from "./dashboard.js";
import reportsRouter from "./reports.js";
import usersRouter from "./users.js";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/auth", authRouter);
router.use("/categories", categoriesRouter);
router.use("/products", productsRouter);
router.use("/movements", movementsRouter);
router.use("/dashboard", dashboardRouter);
router.use("/reports", reportsRouter);
router.use("/users", usersRouter);

export default router;
