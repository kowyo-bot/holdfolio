export function parseMoneyToCents(input: string): number {
  const trimmed = input.trim();
  if (!trimmed) return 0;

  // Normalize commas, currency symbols, etc.
  const normalized = trimmed.replace(/[^0-9.\-]/g, "");
  if (!normalized) return 0;

  const value = Number(normalized);
  if (!Number.isFinite(value)) return 0;

  return Math.round(value * 100);
}

export function formatCents(cents: number): string {
  const dollars = cents / 100;
  return dollars.toLocaleString(undefined, {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}
