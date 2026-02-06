"use client";

import { useMemo, useState, useTransition } from "react";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";

type ColMeta = { className?: string };
import { formatISO } from "date-fns";
import { toast } from "sonner";

import { addUse, deleteItem, updateItem } from "@/app/actions/items";
import { formatCents } from "@/lib/money";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export type ItemRow = {
  id: string;
  name: string;
  acquiredAt: string | null;
  endedAt: string | null;
  holdingDays: number | null;
  costCents: number;
  uses: number;
  costPerUseCents: number | null;
};

function EditItemDialog(props: { item: ItemRow }) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  const [name, setName] = useState(props.item.name);
  const [acquiredAt, setAcquiredAt] = useState(props.item.acquiredAt ?? "");
  const [endedAt, setEndedAt] = useState(props.item.endedAt ?? "");
  const [cost, setCost] = useState(String((props.item.costCents / 100).toFixed(2)));

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          Edit
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit item</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor={`name-${props.item.id}`}>Name</Label>
            <Input
              id={`name-${props.item.id}`}
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor={`acquired-${props.item.id}`}>Acquired date</Label>
            <Input
              id={`acquired-${props.item.id}`}
              type="date"
              value={acquiredAt}
              onChange={(e) => setAcquiredAt(e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor={`ended-${props.item.id}`}>End date</Label>
            <Input
              id={`ended-${props.item.id}`}
              type="date"
              value={endedAt}
              onChange={(e) => setEndedAt(e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor={`cost-${props.item.id}`}>Cost</Label>
            <Input
              id={`cost-${props.item.id}`}
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
                  await updateItem({
                    id: props.item.id,
                    name,
                    acquiredAt: acquiredAt || undefined,
                    endedAt: endedAt || undefined,
                    cost,
                  });
                  toast.success("Item updated");
                  setOpen(false);
                } catch {
                  toast.error("Failed to update item");
                }
              });
            }}
          >
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function RowActions(props: { row: ItemRow }) {
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex items-center justify-end gap-2">
      <EditItemDialog item={props.row} />

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" disabled={pending}>
            More
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            onClick={() => {
              startTransition(async () => {
                try {
                  await addUse({
                    itemId: props.row.id,
                    usedAt: formatISO(new Date(), { representation: "date" }),
                    quantity: 1,
                  });
                  toast.success("Logged 1 use");
                } catch {
                  toast.error("Failed to log use");
                }
              });
            }}
          >
            Log 1 use today
          </DropdownMenuItem>
          <DropdownMenuItem
            className="text-red-600"
            onClick={() => {
              startTransition(async () => {
                try {
                  await deleteItem({ id: props.row.id });
                  toast.success("Item deleted");
                } catch {
                  toast.error("Failed to delete item");
                }
              });
            }}
          >
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

export function ItemsTable(props: { data: ItemRow[] }) {
  const columns = useMemo<ColumnDef<ItemRow>[]>(
    () => [
      {
        accessorKey: "name",
        header: "Item",
        meta: {
          className: "whitespace-normal max-w-[12rem] sm:max-w-none",
        } satisfies ColMeta,
      },
      {
        accessorKey: "acquiredAt",
        header: "Acquired",
        meta: { className: "hidden sm:table-cell" } satisfies ColMeta,
      },
      {
        accessorKey: "endedAt",
        header: "End",
        meta: { className: "hidden md:table-cell" } satisfies ColMeta,
      },
      {
        accessorKey: "holdingDays",
        header: "Holding days",
        meta: { className: "hidden lg:table-cell" } satisfies ColMeta,
      },
      { accessorKey: "uses", header: "Uses" },
      {
        accessorKey: "costCents",
        header: "Cost",
        meta: { className: "hidden sm:table-cell" } satisfies ColMeta,
        cell: ({ row }) => formatCents(row.original.costCents),
      },
      {
        id: "costPerUse",
        header: "Cost / use",
        meta: { className: "hidden lg:table-cell" } satisfies ColMeta,
        cell: ({ row }) => {
          const v = row.original.costPerUseCents;
          return v == null ? "—" : formatCents(v);
        },
      },
      {
        id: "actions",
        header: "",
        meta: { className: "text-right" } satisfies ColMeta,
        cell: ({ row }) => <RowActions row={row.original} />,
      },
    ],
    []
  );

  const table = useReactTable({
    data: props.data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((hg) => (
            <TableRow key={hg.id}>
              {hg.headers.map((h) => (
                <TableHead
                  key={h.id}
                  className={
                    (h.column.columnDef.meta as ColMeta | undefined)?.className
                  }
                >
                  {h.isPlaceholder
                    ? null
                    : flexRender(h.column.columnDef.header, h.getContext())}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows.length ? (
            table.getRowModel().rows.map((r) => (
              <TableRow key={r.id}>
                {r.getVisibleCells().map((c) => (
                  <TableCell
                    key={c.id}
                    className={
                      (c.column.columnDef.meta as ColMeta | undefined)?.className
                    }
                  >
                    {flexRender(c.column.columnDef.cell, c.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={columns.length} className="h-24 text-center">
                No items yet.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
