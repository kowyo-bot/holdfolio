"use server";

import { z } from "zod";
import { and, eq } from "drizzle-orm";
// (usage is assumed daily; no date-fns helpers needed here)
import { revalidatePath } from "next/cache";

import { db } from "@/db";
import { items } from "@/db/schema";
import { parseMoneyToCents } from "@/lib/money";
import { requireSession } from "@/lib/session";

const ymd = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .optional();

const createItemSchema = z.object({
  name: z.string().trim().min(1).max(200),
  acquiredAt: ymd,
  endedAt: ymd,
  cost: z.string().trim().optional(),
});

export async function createItem(input: z.infer<typeof createItemSchema>) {
  const session = await requireSession();
  const data = createItemSchema.parse(input);

  await db.insert(items).values({
    userId: session.user.id,
    name: data.name,
    acquiredAt: data.acquiredAt ?? null,
    endedAt: data.endedAt ?? null,
    costCents: parseMoneyToCents(data.cost ?? ""),
  });

  revalidatePath("/dashboard");
}

const updateItemSchema = z.object({
  id: z.string().uuid(),
  name: z.string().trim().min(1).max(200),
  acquiredAt: ymd,
  endedAt: ymd,
  cost: z.string().trim().optional(),
});

export async function updateItem(input: z.infer<typeof updateItemSchema>) {
  const session = await requireSession();
  const data = updateItemSchema.parse(input);

  await db
    .update(items)
    .set({
      name: data.name,
      acquiredAt: data.acquiredAt ?? null,
      endedAt: data.endedAt ?? null,
      costCents: parseMoneyToCents(data.cost ?? ""),
      updatedAt: new Date(),
    })
    .where(and(eq(items.id, data.id), eq(items.userId, session.user.id)));

  revalidatePath("/dashboard");
}

const deleteItemSchema = z.object({
  id: z.string().uuid(),
});

export async function deleteItem(input: z.infer<typeof deleteItemSchema>) {
  const session = await requireSession();
  const data = deleteItemSchema.parse(input);

  await db
    .delete(items)
    .where(and(eq(items.id, data.id), eq(items.userId, session.user.id)));

  revalidatePath("/dashboard");
}

// addUse removed: Holdfolio assumes 1 use per day held.
