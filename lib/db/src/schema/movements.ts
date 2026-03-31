import { pgTable, text, serial, timestamp, numeric, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const movementsTable = pgTable("movements", {
  id: serial("id").primaryKey(),
  productId: integer("product_id").notNull(),
  type: text("type").notNull(),
  quantity: numeric("quantity", { precision: 10, scale: 2 }).notNull(),
  previousQuantity: numeric("previous_quantity", { precision: 10, scale: 2 }).notNull(),
  newQuantity: numeric("new_quantity", { precision: 10, scale: 2 }).notNull(),
  userId: integer("user_id").notNull(),
  paymentMethod: text("payment_method"),
  observations: text("observations"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertMovementSchema = createInsertSchema(movementsTable).omit({ id: true, createdAt: true });
export type InsertMovement = z.infer<typeof insertMovementSchema>;
export type Movement = typeof movementsTable.$inferSelect;
