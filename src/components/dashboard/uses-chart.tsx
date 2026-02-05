"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export function UsesChart(props: { data: { day: string; uses: number }[] }) {
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={props.data} margin={{ left: 8, right: 8 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="day" tick={{ fontSize: 12 }} interval={4} />
          <YAxis allowDecimals={false} />
          <Tooltip />
          <Bar dataKey="uses" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
