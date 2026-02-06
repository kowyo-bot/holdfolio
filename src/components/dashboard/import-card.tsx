"use client";

import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";

import { importData } from "@/app/actions/import";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function ImportCard() {
  const [pending, startTransition] = useTransition();
  const [mode, setMode] = useState<"merge" | "replace">("merge");
  const [json, setJson] = useState("");

  const sample = useMemo(
    () =>
      JSON.stringify(
        {
          mode: "merge",
          items: [
            {
              name: "AirPods Pro",
              acquiredAt: "2025-10-12",
              cost: "249.00",
              uses: [
                { usedAt: "2026-02-01", quantity: 1 },
                { usedAt: "2026-02-02", quantity: 2 },
              ],
            },
          ],
        },
        null,
        2
      ),
    []
  );

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Import data</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div className="grid gap-2">
          <Label>Mode</Label>
          <Select
            value={mode}
            onValueChange={(v) => setMode(v as "merge" | "replace")}
          >
            <SelectTrigger className="w-full sm:w-[220px]">
              <SelectValue placeholder="Select import mode" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="merge">Merge (recommended)</SelectItem>
              <SelectItem value="replace">Replace (delete my items)</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            Merge updates/creates by item name. Replace deletes your existing items first.
          </p>
        </div>

        <div className="grid gap-2">
          <div className="flex items-center justify-between gap-2">
            <Label htmlFor="import-json">JSON</Label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                const withMode = sample.replace('"merge"', `"${mode}"`);
                setJson(withMode);
                toast.success("Sample pasted");
              }}
            >
              Paste sample
            </Button>
          </div>
          <textarea
            id="import-json"
            value={json}
            onChange={(e) => setJson(e.target.value)}
            placeholder={sample}
            className="min-h-[280px] w-full rounded-md border bg-background p-3 font-mono text-xs leading-5"
          />
        </div>
      </CardContent>
      <CardFooter className="flex flex-col gap-2 sm:flex-row sm:justify-end">
        <Button
          disabled={pending}
          variant={mode === "replace" ? "destructive" : "default"}
          className="w-full sm:w-auto"
          onClick={() => {
            startTransition(async () => {
              try {
                const normalized = JSON.stringify({
                  ...JSON.parse(json || "{}"),
                  mode,
                });
                await importData({ json: normalized });
                toast.success("Import complete");
              } catch (e) {
                toast.error("Import failed. Check JSON format.");
              }
            });
          }}
        >
          Import
        </Button>
      </CardFooter>
    </Card>
  );
}
