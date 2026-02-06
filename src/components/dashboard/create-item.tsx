"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";

import { createItem } from "@/app/actions/items";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function CreateItemDialog() {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  const [name, setName] = useState("");
  const [acquiredAt, setAcquiredAt] = useState("");
  const [endedAt, setEndedAt] = useState("");
  const [cost, setCost] = useState("0.00");

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">Add item</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New item</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="new-name">Name</Label>
            <Input
              id="new-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. AirPods Pro"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="new-acquired">Acquired date</Label>
            <Input
              id="new-acquired"
              type="date"
              value={acquiredAt}
              onChange={(e) => setAcquiredAt(e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="new-ended">End date</Label>
            <Input
              id="new-ended"
              type="date"
              value={endedAt}
              onChange={(e) => setEndedAt(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Leave blank if you still have it.
            </p>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="new-cost">Cost</Label>
            <Input
              id="new-cost"
              inputMode="decimal"
              value={cost}
              onChange={(e) => setCost(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            disabled={pending}
            onClick={() => {
              startTransition(async () => {
                try {
                  await createItem({
                    name,
                    acquiredAt: acquiredAt || undefined,
                    endedAt: endedAt || undefined,
                    cost,
                  });
                  toast.success("Item created");
                  setOpen(false);
                  setName("");
                  setAcquiredAt("");
                  setEndedAt("");
                  setCost("0.00");
                } catch {
                  toast.error("Failed to create item");
                }
              });
            }}
          >
            Create
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
