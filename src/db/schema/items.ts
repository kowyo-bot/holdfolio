import {
  date,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

export const items = pgTable(
  "items",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id").notNull(),

    name: text("name").notNull(),
    acquiredAt: date("acquired_at"),
    endedAt: date("ended_at"),
    costCents: integer("cost_cents").notNull().default(0),

    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    userIdIdx: index("items_user_id_idx").on(t.userId),
    acquiredAtIdx: index("items_acquired_at_idx").on(t.acquiredAt),
    endedAtIdx: index("items_ended_at_idx").on(t.endedAt),
  })
);

export const itemUses = pgTable(
  "item_uses",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    itemId: uuid("item_id")
      .notNull()
      .references(() => items.id, { onDelete: "cascade" }),
    userId: text("user_id").notNull(),

    usedAt: date("used_at").notNull(),
    quantity: integer("quantity").notNull().default(1),

    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    itemIdUsedAtIdx: index("item_uses_item_id_used_at_idx").on(t.itemId, t.usedAt),
    userIdUsedAtIdx: index("item_uses_user_id_used_at_idx").on(t.userId, t.usedAt),
  })
);
