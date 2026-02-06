"use server";

import { z } from "zod";
import { and, eq } from "drizzle-orm";
import { addDays, formatISO } from "date-fns";
import { revalidatePath } from "next/cache";

import { db } from "@/db";
import { itemUses, items } from "@/db/schema";
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
      uses: z
        .array(
          z.object({
            usedAt: ymd,
            quantity: z.number().int().min(1).max(100).optional(),
          })
        )
        .optional(),

      // Compact import option: generate one use per day starting from acquiredAt (or dailyUsesFrom)
      dailyUsesTotal: z.number().int().min(0).max(20000).optional(),
      dailyUsesQuantity: z.number().int().min(1).max(100).optional(),
      dailyUsesFrom: ymd.optional().nullable(),
      dailyUsesUntil: ymd.optional().nullable(),
    })
  ),
  mode: z.enum(["merge", "replace"]).optional().default("merge"),
});

export async function importData(input: { json: string }) {
  const session = await requireSession();

  const parsed = importSchema.parse(JSON.parse(input.json));

  await db.transaction(async (tx) => {
    if (parsed.mode === "replace") {
      // delete uses first via cascade on items? item_uses references items with cascade.
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
      let itemId = byName.get(key);

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

        itemId = inserted[0]!.id;
        byName.set(key, itemId);
      }

      if (it.uses?.length) {
        await tx.insert(itemUses).values(
          it.uses.map((u) => ({
            userId: session.user.id,
            itemId: itemId!,
            usedAt: u.usedAt,
            quantity: u.quantity ?? 1,
          }))
        );
        continue;
      }

      const dailyTotal = it.dailyUsesTotal ?? 0;
      if (dailyTotal > 0) {
        const startStr = it.dailyUsesFrom ?? it.acquiredAt;
        if (!startStr) {
          // Can't infer a daily range without a start date.
          continue;
        }

        const untilStr =
          it.dailyUsesUntil ?? it.endedAt ?? formatISO(new Date(), { representation: "date" });

        const start = new Date(`${startStr}T00:00:00Z`);
        const until = new Date(`${untilStr}T00:00:00Z`);
        const qty = it.dailyUsesQuantity ?? 1;

        const rows: { userId: string; itemId: string; usedAt: string; quantity: number }[] = [];
        for (let i = 0; i < dailyTotal; i++) {
          const d = addDays(start, i);
          if (d.getTime() > until.getTime()) break;
          rows.push({
            userId: session.user.id,
            itemId: itemId!,
            usedAt: formatISO(d, { representation: "date" }),
            quantity: qty,
          });
        }

        // Batch insert to keep payloads reasonable.
        const BATCH = 500;
        for (let i = 0; i < rows.length; i += BATCH) {
          await tx.insert(itemUses).values(rows.slice(i, i + BATCH));
        }
      }
    }
  });

  revalidatePath("/dashboard");
}
