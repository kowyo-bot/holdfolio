import { formatISO } from "date-fns";

import { requireSession } from "@/lib/session";
import { listItemsWithMetrics, getUsesByDay } from "@/db/queries/dashboard";
import { formatCents } from "@/lib/money";
import { CreateItemDialog } from "@/components/dashboard/create-item";
import { ItemsTable, type ItemRow } from "@/components/dashboard/items-table";
import { UsesChart } from "@/components/dashboard/uses-chart";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

function toYmd(date: Date) {
  return formatISO(date, { representation: "date" });
}

export default async function DashboardPage(props: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await requireSession();
  const searchParams = (await props.searchParams) ?? {};
  const asOf = typeof searchParams.asOf === "string" ? searchParams.asOf : toYmd(new Date());

  const [rows, usesByDay] = await Promise.all([
    listItemsWithMetrics({ userId: session.user.id, asOfDate: asOf }),
    getUsesByDay({ userId: session.user.id, asOfDate: asOf, days: 30 }),
  ]);

  const itemsForTable: ItemRow[] = rows.map((r) => {
    const acquired = r.acquiredAt ? new Date(`${r.acquiredAt}T00:00:00Z`) : null;
    const asOfDate = new Date(`${asOf}T00:00:00Z`);
    const holdingDays = acquired
      ? Math.max(0, Math.floor((asOfDate.getTime() - acquired.getTime()) / (1000 * 60 * 60 * 24)))
      : null;

    const uses = Number(r.uses ?? 0);
    const costPerUseCents = uses > 0 ? Math.round(r.costCents / uses) : null;

    return {
      id: r.id,
      name: r.name,
      acquiredAt: r.acquiredAt,
      holdingDays,
      costCents: r.costCents,
      uses,
      costPerUseCents,
    };
  });

  const totalCostCents = itemsForTable.reduce((acc, i) => acc + i.costCents, 0);
  const totalUses = itemsForTable.reduce((acc, i) => acc + i.uses, 0);
  const avgCostPerUseCents = totalUses > 0 ? Math.round(totalCostCents / totalUses) : null;

  return (
    <div className="min-h-screen p-4 pb-[calc(env(safe-area-inset-bottom)+1rem)] sm:p-6 md:p-10">
      <div className="mx-auto max-w-6xl grid gap-4 sm:gap-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold tracking-tight">Holdfolio</h1>
            <p className="text-sm text-muted-foreground">
              As-of metrics dashboard for your stuff.
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <form
              action="/dashboard"
              className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-end"
            >
              <div className="grid gap-1">
                <Label htmlFor="asOf" className="text-muted-foreground">
                  As of
                </Label>
                <Input id="asOf" name="asOf" type="date" defaultValue={asOf} />
              </div>
              <Button
                type="submit"
                variant="outline"
                className="w-full sm:w-auto"
              >
                Apply
              </Button>
            </form>

            <div className="w-full sm:w-auto">
              <CreateItemDialog />
            </div>

            <Button
              asChild
              variant="outline"
              className="w-full sm:w-auto"
            >
              <a href="/dashboard/import">Import</a>
            </Button>
          </div>
        </div>

        <div className="grid gap-3 sm:gap-4 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>Total cost</CardTitle>
            </CardHeader>
            <CardContent className="text-2xl font-semibold">
              {formatCents(totalCostCents)}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Total uses</CardTitle>
            </CardHeader>
            <CardContent className="text-2xl font-semibold">{totalUses}</CardContent>
            <p className="px-6 pb-6 text-xs text-muted-foreground">
              As of {asOf}
            </p>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Avg cost / use</CardTitle>
            </CardHeader>
            <CardContent className="text-2xl font-semibold">
              {avgCostPerUseCents == null ? "—" : formatCents(avgCostPerUseCents)}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Uses (last 30 days)</CardTitle>
          </CardHeader>
          <CardContent>
            <UsesChart data={usesByDay} />
          </CardContent>
        </Card>

        <Separator />

        <div className="grid gap-3">
          <h2 className="text-lg font-semibold">Items</h2>
          <ItemsTable data={itemsForTable} />
        </div>
      </div>
    </div>
  );
}
