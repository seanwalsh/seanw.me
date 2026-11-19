"use client";

import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

type Point = { day: string; clicks: number };

const fmtDay = (d: string) =>
  new Date(`${d}T00:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric" });

export function ClicksChart({ data }: { data: Point[] }) {
  const total = data.reduce((s, p) => s + p.clicks, 0);
  return (
    <div className="h-64 w-full text-accent" role="img" aria-label={`Clicks per day, ${total} total`}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -20 }}>
          <defs>
            <linearGradient id="clicksFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="currentColor" stopOpacity={0.25} />
              <stop offset="100%" stopColor="currentColor" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} stroke="currentColor" strokeOpacity={0.1} />
          <XAxis
            dataKey="day"
            tickFormatter={fmtDay}
            tick={{ fill: "var(--muted)", fontSize: 12 }}
            tickLine={false}
            axisLine={false}
            minTickGap={24}
          />
          <YAxis allowDecimals={false} tick={{ fill: "var(--muted)", fontSize: 12 }} tickLine={false} axisLine={false} />
          <Tooltip
            cursor={{ stroke: "currentColor", strokeOpacity: 0.2 }}
            contentStyle={{
              background: "var(--card)",
              border: "1px solid var(--border)",
              borderRadius: 8,
              color: "var(--fg)",
              fontSize: 13,
            }}
            labelFormatter={(d) => fmtDay(String(d))}
            formatter={(v) => [v, "Clicks"]}
          />
          <Area type="monotone" dataKey="clicks" stroke="currentColor" strokeWidth={2} fill="url(#clicksFill)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
