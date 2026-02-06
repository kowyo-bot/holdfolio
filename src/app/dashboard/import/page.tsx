import Link from "next/link";

import { requireSession } from "@/lib/session";
import { ImportCard } from "@/components/dashboard/import-card";
import { Button } from "@/components/ui/button";

export default async function ImportPage() {
  await requireSession();

  return (
    <div className="min-h-screen p-4 pb-[calc(env(safe-area-inset-bottom)+1rem)] sm:p-6 md:p-10">
      <div className="mx-auto max-w-3xl grid gap-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold tracking-tight">Import</h1>
            <p className="text-sm text-muted-foreground">
              Paste JSON to import items and use logs.
            </p>
          </div>
          <Button asChild variant="outline" size="sm">
            <Link href="/dashboard">Back</Link>
          </Button>
        </div>

        <ImportCard />
      </div>
    </div>
  );
}
