import { pgTable, text, serial, timestamp, numeric, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const productsTable = pgTable("products", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  sku: text("sku"),
  description: text("description"),
  categoryId: integer("category_id").notNull(),
  unit: text("unit").notNull().default("unidade"),
  quantity: numeric("quantity", { precision: 10, scale: 2 }).notNull().default("0"),
  minQuantity: numeric("min_quantity", { precision: 10, scale: 2 }).notNull().default("5"),
  costPrice: numeric("cost_price", { precision: 10, scale: 2 }).notNull().default("0"),
  salePrice: numeric("sale_price", { precision: 10, scale: 2 }).notNull().default("0"),
  supplier: text("supplier"),
  expiryDate: timestamp("expiry_date", { withTimezone: true }),
  entryDate: timestamp("entry_date", { withTimezone: true }),
  observations: text("observations"),
  imageUrl: text("image_url"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertProductSchema = createInsertSchema(productsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertProduct = z.infer<typeof insertProductSchema>;
export type Product = typeof productsTable.$inferSelect;
