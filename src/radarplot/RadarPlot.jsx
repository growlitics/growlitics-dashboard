import { useMemo, useState } from "react";
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
} from "recharts";

import { DEFAULT_STRATEGIES } from "./defaultStrategies";

const COLOR_PALETTE = [
  "#FFD700",
  "#2ca02c",
  "#d62728",
  "#1f77b4",
  "#ff7f0e",
  "#9467bd",
  "#8c564b",
  "#e377c2",
  "#7f7f7f",
  "#17becf",
];

const KPI_FIELDS = [
  { key: "bonus_penalty", label: "Bonus/Penalty" },
  { key: "profit", label: "Profit" },
  { key: "energy_cost", label: "Energy Cost" },
  { key: "weight_achieved", label: "Weight" },
  { key: "base_revenue", label: "Base Revenue" },
];

const KPI_RANGES = {
  profit: [0, 50],
  energy_cost: [0, 8],
  weight_achieved: [20, 100],
  bonus_penalty: [-3, 5],
  base_revenue: [0, 35],
};

const round1 = (n) => Math.round(n * 10) / 10;

const renderAngleTick = (props) => {
  const { payload, x = 0, y = 0, cx = 0, cy = 0 } = props;
  const xNum = Number(x);
  const yNum = Number(y);
  const cxNum = Number(cx);
  const cyNum = Number(cy);
  const angle = Math.atan2(yNum - cyNum, xNum - cxNum);
  const isLeft = Math.cos(angle) < 0;
  const isTop = Math.sin(angle) < 0;
  const dx = isLeft ? -10 : 10;
  const dy = isTop ? -5 : 15;
  return (
    <text
      x={xNum + dx}
      y={yNum + dy}
      textAnchor={isLeft ? "end" : "start"}
      fill="currentColor"
      fontSize={12}
    >
      {payload.value}
    </text>
  );
};

const renderActiveDot = (color) => (props) => {
  const { cx, cy, payload } = props;
  const raw = round1(payload.raw);
  return (
    <g>
      <circle cx={cx} cy={cy} r={4} stroke={color} strokeWidth={2} fill="#fff" />
      <text
        x={cx}
        y={Number(cy) - 8}
        textAnchor="middle"
        fill={color}
        fontSize={12}
        fontWeight="bold"
      >
        {raw}
      </text>
    </g>
  );
};

const RadarPlot = () => {
  const cultivations = Object.keys(DEFAULT_STRATEGIES);
  const [cultivation, setCultivation] = useState(cultivations[0]);
  const [strategy, setStrategy] = useState("Default");

  const strategies = DEFAULT_STRATEGIES[cultivation];
  const selected = useMemo(
    () => strategies.find((s) => s.name === strategy) || strategies[0],
    [strategies, strategy]
  );

  const colorMap = useMemo(() => {
    const sorted = [...strategies].sort(
      (a, b) => (Number(b.profit) || 0) - (Number(a.profit) || 0)
    );
    const map = {};
    sorted.forEach((s, idx) => {
      map[s.name] = COLOR_PALETTE[idx % COLOR_PALETTE.length];
    });
    return map;
  }, [strategies]);

  const chartData = useMemo(() => {
    return KPI_FIELDS.map((kpi) => {
      const [domainMin, domainMax] = KPI_RANGES[kpi.key];
      const v = Number(selected[kpi.key]) || 0;
      const scaled = (v - domainMin) / (domainMax - domainMin);
      return { metric: kpi.label, value: scaled, raw: round1(v) };
    });
  }, [selected]);

  const color = colorMap[selected.name] || COLOR_PALETTE[0];

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center space-x-4 mb-4">
        <select
          value={cultivation}
          onChange={(e) => setCultivation(e.target.value)}
          className="rounded-md p-2"
        >
          {cultivations.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <select
          value={strategy}
          onChange={(e) => setStrategy(e.target.value)}
          className="rounded-md p-2"
        >
          {strategies.map((s) => (
            <option key={s.name} value={s.name}>
              {s.name}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={() => setStrategy("Default")}
          className={`bg-green-600 text-white font-semibold px-4 py-2 rounded-md shadow-sm hover:bg-green-500 ${
            strategy === "Default" ? "" : "opacity-50"
          }`}
        >
          Default
        </button>
        <button
          type="button"
          onClick={() => setStrategy("Optimized")}
          className={`bg-yellow-400 text-black font-semibold px-4 py-2 rounded-md shadow-sm hover:bg-yellow-300 ${
            strategy === "Optimized" ? "" : "opacity-50"
          }`}
        >
          Optimized
        </button>
      </div>
      <div className="flex-1 flex items-center justify-center">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={chartData} outerRadius="90%">
            <PolarGrid stroke="currentColor" strokeOpacity={0.2} />
            <PolarAngleAxis dataKey="metric" tick={renderAngleTick} tickLine={false} />
            <PolarRadiusAxis
              tick={false}
              axisLine={false}
              tickLine={false}
              domain={[0, 1]}
            />
            <Radar
              dataKey="value"
              stroke={color}
              fill={color}
              fillOpacity={0.4}
              dot={{ r: 3, stroke: color, fill: color }}
              activeDot={renderActiveDot(color)}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default RadarPlot;
