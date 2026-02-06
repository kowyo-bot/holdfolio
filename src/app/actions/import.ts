"use server";

import { z } from "zod";
import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { db } from "@/db";
import { items } from "@/db/schema";
import { parseMoneyToCents } from "@/lib/money";
import { requireSession } from "@/lib/session";

const ymd = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

const importSchema = z.object({
  items: z.array(
    z.object({
      name: z.string().trim().min(1).max(200),
      acquiredAt: ymd.optional().nullable(),
      endedAt: ymd.optional().nullable(),
      // either costCents or a human money string
      costCents: z.number().int().min(0).optional(),
      cost: z.string().optional(),
    })
  ),
  mode: z.enum(["merge", "replace"]).optional().default("merge"),
});

export async function importData(input: { json: string }) {
  const session = await requireSession();

  const parsed = importSchema.parse(JSON.parse(input.json));

  await db.transaction(async (tx) => {
    if (parsed.mode === "replace") {
      // item_uses references items with cascade; deleting items clears uses.
      await tx.delete(items).where(eq(items.userId, session.user.id));
    }

    // Build a quick lookup for merge mode: existing items by name.
    const existing =
      parsed.mode === "merge"
        ? await tx
            .select({ id: items.id, name: items.name })
            .from(items)
            .where(eq(items.userId, session.user.id))
        : [];

    const byName = new Map(existing.map((r) => [r.name.toLowerCase(), r.id]));

    for (const it of parsed.items) {
      const costCents =
        typeof it.costCents === "number"
          ? it.costCents
          : parseMoneyToCents(it.cost ?? "");

      const key = it.name.toLowerCase();
      const itemId = byName.get(key);

      if (itemId) {
        await tx
          .update(items)
          .set({
            acquiredAt: it.acquiredAt ?? null,
            endedAt: it.endedAt ?? null,
            costCents,
            updatedAt: new Date(),
          })
          .where(and(eq(items.id, itemId), eq(items.userId, session.user.id)));
      } else {
        const inserted = await tx
          .insert(items)
          .values({
            userId: session.user.id,
            name: it.name,
            acquiredAt: it.acquiredAt ?? null,
            endedAt: it.endedAt ?? null,
            costCents,
          })
          .returning({ id: items.id });

        byName.set(key, inserted[0]!.id);
      }
    }
  });

  revalidatePath("/dashboard");
}
