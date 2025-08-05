import { useEffect, useMemo, useState } from "react";
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
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

const round1 = (n) => Math.round(n * 10) / 10;

function renderActiveDot(color, name) {
  return (props) => {
    const { cx, cy, payload } = props;
    const raw = round1(payload[`${name}-raw`]);
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
}

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

const RadarPlot = () => {
  const [selectedCultivations, setSelectedCultivations] = useState(
    Object.keys(DEFAULT_STRATEGIES)
  );
  const [strategies, setStrategies] = useState([]);
  const [visible, setVisible] = useState({});

  useEffect(() => {
    const strategyNames = new Set();
    selectedCultivations.forEach((c) => {
      DEFAULT_STRATEGIES[c].forEach((s) => strategyNames.add(s.name));
    });
    const averaged = Array.from(strategyNames).map((name) => {
      let count = 0;
      let bonus_penalty = 0;
      let profit = 0;
      let energy_cost = 0;
      let weight_achieved = 0;
      let base_revenue_a = 0;
      let base_revenue_b = 0;
      let base_revenue = 0;
      selectedCultivations.forEach((c) => {
        const st = DEFAULT_STRATEGIES[c].find((s) => s.name === name);
        if (st) {
          bonus_penalty += Number(st.bonus_penalty) || 0;
          profit += Number(st.profit) || 0;
          energy_cost += Number(st.energy_cost) || 0;
          weight_achieved += Number(st.weight_achieved) || 0;
          base_revenue_a += Number(st.base_revenue_a) || 0;
          base_revenue_b += Number(st.base_revenue_b) || 0;
          base_revenue +=
            st.base_revenue !== undefined
              ? Number(st.base_revenue) || 0
              : (Number(st.base_revenue_a) || 0) +
                (Number(st.base_revenue_b) || 0);
          count += 1;
        }
      });
      const denom = count || 1;
      return {
        name,
        bonus_penalty: round1(bonus_penalty / denom),
        profit: round1(profit / denom),
        energy_cost: round1(energy_cost / denom),
        weight_achieved: round1(weight_achieved / denom),
        base_revenue_a: round1(base_revenue_a / denom),
        base_revenue_b: round1(base_revenue_b / denom),
        base_revenue: round1(base_revenue / denom),
      };
    });
    setStrategies(averaged);
  }, [selectedCultivations]);

  useEffect(() => {
    setVisible((prev) => {
      const vis = { ...prev };
      strategies.forEach((st) => {
        if (vis[st.name] === undefined) vis[st.name] = true;
      });
      return vis;
    });
  }, [strategies]);

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
      const entry = { metric: kpi.label };
      strategies.forEach((s) => {
        const v = Number(s[kpi.key]) || 0;
        const scaled = (v - domainMin) / (domainMax - domainMin);
        entry[s.name] = scaled;
        entry[`${s.name}-raw`] = round1(v);
      });
      return entry;
    });
  }, [strategies]);

  const toggleCultivation = (name) => {
    setSelectedCultivations((prev) =>
      prev.includes(name) ? prev.filter((c) => c !== name) : [...prev, name]
    );
  };

  const toggle = (name) => {
    setVisible((v) => ({ ...v, [name]: !v[name] }));
  };

  return (
    <div style={{ width: "100%", height: "100%" }}>
      <div className="flex justify-center gap-2 flex-wrap">
        {Object.keys(DEFAULT_STRATEGIES).map((c) => {
          const isSelected = selectedCultivations.includes(c);
          return (
            <button
              key={c}
              type="button"
              onClick={() => toggleCultivation(c)}
              className={`px-3 py-1 rounded-full text-sm font-semibold border ${
                isSelected
                  ? "bg-blue-500 text-white border-blue-500"
                  : "text-blue-500 border-blue-500"
              }`}
            >
              {c}
            </button>
          );
        })}
      </div>
      <div className="mt-6 flex justify-center gap-2 flex-wrap">
        {strategies.map((s) => {
          const color = colorMap[s.name];
          const isOn = visible[s.name];
          return (
            <button
              key={s.name}
              type="button"
              onClick={() => toggle(s.name)}
              className="px-3 py-1 rounded-full text-sm font-semibold border"
              style={{
                borderColor: color,
                backgroundColor: isOn ? color : "transparent",
                color: isOn ? "#000" : color,
              }}
            >
              {s.name}
            </button>
          );
        })}
      </div>
      <div className="mt-8 flex justify-center">
        <RadarChart
          cx="50%"
          cy="50%"
          outerRadius="80%"
          width={250}
          height={200}
          data={chartData}
          margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
        >
          <PolarGrid stroke="currentColor" strokeOpacity={0.2} />
          <PolarAngleAxis dataKey="metric" tick={renderAngleTick} tickLine={false} />
          <PolarRadiusAxis
            tick={false}
            axisLine={false}
            tickLine={false}
            domain={[0, 1]}
          />
          {strategies
            .filter((s) => visible[s.name])
            .map((s) => {
              const color = colorMap[s.name];
              return (
                <Radar
                  key={s.name}
                  name={s.name}
                  dataKey={s.name}
                  stroke={color}
                  fill={color}
                  fillOpacity={0.4}
                  dot={{ r: 3, stroke: color, fill: color }}
                  activeDot={renderActiveDot(color, s.name)}
                />
              );
            })}
        </RadarChart>
      </div>
    </div>
  );
};

export default RadarPlot;

