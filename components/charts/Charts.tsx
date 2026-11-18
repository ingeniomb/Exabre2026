"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  LineChart,
  ReferenceArea,
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
  xDecimals = 0,
}: {
  data: object[];
  xKey: string;
  yKey: string;
  xDecimals?: number;
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
            tickFormatter={(v: number) => v.toFixed(xDecimals)}
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

export interface SerieDef {
  key: string;
  name: string;
  color: string;
  dashed?: boolean;
}

export interface Banda {
  y1: number;
  y2: number;
  label: string;
  color: string;
}

/** Varias series con la MISMA unidad sobre un solo eje, con leyenda y bandas horizontales opcionales. */
export function MultiSeriesChart({
  data,
  xKey,
  series,
  unit,
  xUnit = "s",
  yDomain,
  refs = [],
  bandas = [],
  height = 220,
  decimals = 1,
  xDecimals = 0,
}: {
  data: object[];
  xKey: string;
  series: SerieDef[];
  unit: string;
  xUnit?: string;
  yDomain?: YAxisProps["domain"];
  refs?: RefMark[];
  bandas?: Banda[];
  height?: number;
  decimals?: number;
  xDecimals?: number;
}) {
  return (
    <div className="w-full">
      <div className="mb-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-300">
        {series.map((s) => (
          <span key={s.key} className="inline-flex items-center gap-1.5">
            <span
              className="inline-block h-0.5 w-4 rounded"
              style={{ background: s.dashed ? `repeating-linear-gradient(90deg, ${s.color} 0 4px, transparent 4px 7px)` : s.color }}
            />
            {s.name}
          </span>
        ))}
      </div>
      <div style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 8, right: 12, bottom: 4, left: -8 }}>
            <CartesianGrid {...grid} />
            {bandas.map((b) => (
              <ReferenceArea
                key={b.label}
                y1={b.y1}
                y2={b.y2}
                fill={b.color}
                fillOpacity={0.08}
                stroke="none"
                label={b.label ? { value: b.label, fill: "#94a3b8", fontSize: 10, position: "insideLeft" } : undefined}
                ifOverflow="hidden"
              />
            ))}
            <XAxis
              dataKey={xKey}
              {...axis}
              type="number"
              domain={["dataMin", "dataMax"]}
              tickFormatter={(v: number) => v.toFixed(xDecimals)}
              unit={` ${xUnit}`}
              minTickGap={28}
            />
            <YAxis {...axis} domain={yDomain ?? ["auto", "auto"]} width={52} tickFormatter={(v: number) => v.toFixed(0)} />
            <Tooltip
              {...tooltipStyle}
              formatter={(v, n) => [`${Number(v).toFixed(decimals)} ${unit}`, String(n)]}
              labelFormatter={(l) => `t = ${Number(l).toFixed(xDecimals + 1)} ${xUnit}`}
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
            {series.map((s) => (
              <Line
                key={s.key}
                type="monotone"
                dataKey={s.key}
                name={s.name}
                stroke={s.color}
                strokeWidth={2}
                strokeDasharray={s.dashed ? "6 4" : undefined}
                dot={false}
                isAnimationActive={false}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
