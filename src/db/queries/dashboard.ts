import { and, eq, gte, lte, sql } from "drizzle-orm";
import { subDays, formatISO } from "date-fns";

import { db } from "@/db";
import { itemUses, items } from "@/db/schema";

export type ItemMetricsRow = {
  id: string;
  name: string;
  acquiredAt: string | null;
  endedAt: string | null;
  costCents: number;
  uses: number;
};

export async function listItemsWithMetrics(params: {
  userId: string;
  asOfDate: string; // YYYY-MM-DD
}): Promise<ItemMetricsRow[]> {
  const { userId, asOfDate } = params;

  const rows = await db
    .select({
      id: items.id,
      name: items.name,
      acquiredAt: items.acquiredAt,
      endedAt: items.endedAt,
      costCents: items.costCents,
      uses: sql<number>`coalesce(sum(${itemUses.quantity}), 0)`.mapWith(Number),
    })
    .from(items)
    .leftJoin(
      itemUses,
      and(
        eq(itemUses.itemId, items.id),
        eq(itemUses.userId, userId),
        // If an item has endedAt, don't count uses after min(endedAt, asOfDate).
        lte(
          itemUses.usedAt,
          sql`case
            when ${items.endedAt} is null then ${asOfDate}
            when ${items.endedAt} > ${asOfDate} then ${asOfDate}
            else ${items.endedAt}
          end`
        )
      )
    )
    .where(eq(items.userId, userId))
    .groupBy(items.id)
    .orderBy(items.createdAt);

  return rows;
}

export type UsesByDayRow = { day: string; uses: number };

export async function getUsesByDay(params: {
  userId: string;
  asOfDate: string; // YYYY-MM-DD
  days?: number;
}): Promise<UsesByDayRow[]> {
  const { userId, asOfDate, days = 30 } = params;

  const asOf = new Date(`${asOfDate}T00:00:00Z`);
  const start = subDays(asOf, days - 1);
  const startStr = formatISO(start, { representation: "date" });

  const rows = await db
    .select({
      day: itemUses.usedAt,
      uses: sql<number>`sum(${itemUses.quantity})`.mapWith(Number),
    })
    .from(itemUses)
    .where(
      and(
        eq(itemUses.userId, userId),
        gte(itemUses.usedAt, startStr),
        lte(itemUses.usedAt, asOfDate)
      )
    )
    .groupBy(itemUses.usedAt)
    .orderBy(itemUses.usedAt);

  const byDay = new Map<string, number>();
  for (const r of rows) byDay.set(String(r.day), Number(r.uses ?? 0));

  const filled: UsesByDayRow[] = [];
  for (let i = 0; i < days; i++) {
    const d = subDays(asOf, days - 1 - i);
    const key = formatISO(d, { representation: "date" });
    filled.push({ day: key, uses: byDay.get(key) ?? 0 });
  }

  return filled;
}
