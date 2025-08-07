import { useMemo } from "react";
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
} from "recharts";

const round3 = (n) => Math.round(n * 1000) / 1000;

function renderActiveDot(color, name) {
  return (props) => {
    const { cx, cy, payload } = props;
    const raw = round3(payload[`${name}-raw`]);
    return (
      <g>
        <circle cx={cx} cy={cy} r={4} stroke={color} strokeWidth={2} fill="#fff" />
        <text
          x={cx}
          y={Number(cy) - 8}
          textAnchor="middle"
          fill={color}
          fontSize={18}
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
  { key: "profit_per_m2", label: "Profit per m²" },
  { key: "energy_cost", label: "Energy Cost" },
  { key: "weight_achieved", label: "Weight" },
  { key: "base_revenue", label: "Base Revenue" },
];

const KPI_RANGES = {
  profit_per_m2: [0, 50],
  energy_cost: [0, 8],
  weight_achieved: [0, 100],
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
      fontSize={14}
    >
      {payload.value}
    </text>
  );
};

const RadarPlot = ({
  strategies = [],
  visible = {},
  colorMap = {},
  selectedCultivations, // unused but accepted via props
  toggleStrategy, // unused but accepted via props
  toggleCultivation, // unused but accepted via props
}) => {
  const chartData = useMemo(() => {
    return KPI_FIELDS.map((kpi) => {
      const [domainMin, domainMax] = KPI_RANGES[kpi.key];
      const entry = { metric: kpi.label };
      strategies.forEach((s) => {
        const v = Number(s[kpi.key]) || 0;
        const scaled = (v - domainMin) / (domainMax - domainMin);
        entry[s.name] = scaled;
        entry[`${s.name}-raw`] = round3(v);
      });
      return entry;
    });
  }, [strategies]);

  return (
    <div className="w-full h-full flex items-center justify-center">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart
          cx="50%"
          cy="50%"
          outerRadius="80%"
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
      </ResponsiveContainer>
    </div>
  );
};

export default RadarPlot;

