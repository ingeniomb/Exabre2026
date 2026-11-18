"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  type YAxisProps,
} from "recharts";

const axis = { stroke: "#5b6b86", fontSize: 11, tickLine: false };
const grid = { stroke: "#1f3760", strokeDasharray: "3 4", vertical: false };
const tooltipStyle = {
  contentStyle: {
    background: "#070e1c",
    border: "1px solid rgba(34,211,238,0.35)",
    borderRadius: 8,
    fontSize: 12,
    color: "#e6eefb",
  },
  labelStyle: { color: "#94a3b8" },
  itemStyle: { color: "#e6eefb" },
};

export interface RefMark {
  value: number;
  label: string;
  color?: string;
}

/** Serie temporal de una sola variable (un solo eje). */
export function TimeSeriesChart({
  data,
  xKey,
  yKey,
  name,
  unit,
  color = "#22d3ee",
  xUnit = "s",
  yDomain,
  refs = [],
  height = 200,
  decimals = 1,
}: {
  data: object[];
  xKey: string;
  yKey: string;
  name: string;
  unit: string;
  color?: string;
  xUnit?: string;
  yDomain?: YAxisProps["domain"];
  refs?: RefMark[];
  height?: number;
  decimals?: number;
}) {
  return (
    <div style={{ height }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 12, bottom: 4, left: -8 }}>
          <CartesianGrid {...grid} />
          <XAxis
            dataKey={xKey}
            {...axis}
            type="number"
            domain={["dataMin", "dataMax"]}
            tickFormatter={(v: number) => `${Math.round(v)}`}
            unit={` ${xUnit}`}
            minTickGap={28}
          />
          <YAxis {...axis} domain={yDomain ?? ["auto", "auto"]} width={52} tickFormatter={(v: number) => v.toFixed(decimals > 1 ? 1 : 0)} />
          <Tooltip
            {...tooltipStyle}
            formatter={(v) => [`${Number(v).toFixed(decimals)} ${unit}`, name]}
            labelFormatter={(l) => `t = ${Number(l).toFixed(xUnit === "ms" ? 0 : 1)} ${xUnit}`}
            cursor={{ stroke: "#64748b", strokeWidth: 1 }}
          />
          {refs.map((r) => (
            <ReferenceLine
              key={r.label}
              y={r.value}
              stroke={r.color ?? "#f97316"}
              strokeDasharray="5 4"
              label={{ value: r.label, fill: "#94a3b8", fontSize: 10, position: "insideTopRight" }}
            />
          ))}
          <Line
            type="monotone"
            dataKey={yKey}
            name={name}
            stroke={color}
            strokeWidth={2}
            dot={false}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

/** Espectro de magnitud (FFT) con marcas de frecuencias de interés. */
export function SpectrumChart({
  data,
  marks,
  height = 200,
}: {
  data: { f: number; a: number }[];
  marks: RefMark[];
  height?: number;
}) {
  return (
    <div style={{ height }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 16, right: 12, bottom: 4, left: -8 }}>
          <CartesianGrid {...grid} />
          <XAxis dataKey="f" {...axis} type="number" domain={[0, "dataMax"]} unit=" Hz" minTickGap={28} />
          <YAxis {...axis} width={52} domain={[0, (max: number) => Math.max(0.5, Math.ceil(max * 1.15 * 10) / 10)]} tickFormatter={(v: number) => v.toFixed(1)} />
          <Tooltip
            {...tooltipStyle}
            formatter={(v) => [`${Number(v).toFixed(3)} m/s²`, "Amplitud"]}
            labelFormatter={(l) => `f = ${Number(l).toFixed(1)} Hz`}
            cursor={{ stroke: "#64748b", strokeWidth: 1 }}
          />
          {marks.map((m) => (
            <ReferenceLine
              key={m.label}
              x={m.value}
              stroke={m.color ?? "#94a3b8"}
              strokeDasharray="4 4"
              label={{ value: m.label, fill: "#cbd5e1", fontSize: 10, position: "top" }}
            />
          ))}
          <Area
            type="linear"
            dataKey="a"
            stroke="#22d3ee"
            strokeWidth={2}
            fill="#22d3ee"
            fillOpacity={0.18}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
