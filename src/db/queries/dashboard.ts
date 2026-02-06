import { eq } from "drizzle-orm";

import { db } from "@/db";
import { items } from "@/db/schema";

export type ItemMetricsRow = {
  id: string;
  name: string;
  acquiredAt: string | null;
  endedAt: string | null;
  costCents: number;
};

// Note: usage is assumed daily (1 use per day held), so we only need item fields here.
export async function listItemsWithMetrics(params: {
  userId: string;
  asOfDate: string; // YYYY-MM-DD
}): Promise<ItemMetricsRow[]> {
  const { userId } = params;

  const rows = await db
    .select({
      id: items.id,
      name: items.name,
      acquiredAt: items.acquiredAt,
      endedAt: items.endedAt,
      costCents: items.costCents,
    })
    .from(items)
    .where(eq(items.userId, userId))
    .orderBy(items.createdAt);

  return rows;
}
