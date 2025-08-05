import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from "recharts";

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

const RadarPlot = ({ chartData, visibleStrategies, colorMap }) => {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <RadarChart cx="50%" cy="50%" outerRadius="80%" data={chartData}>
        <PolarGrid stroke="currentColor" strokeOpacity={0.2} />
        <PolarAngleAxis dataKey="metric" tick={renderAngleTick} tickLine={false} />
        <PolarRadiusAxis tick={false} axisLine={false} tickLine={false} domain={[0, 1]} />
        {visibleStrategies.map((s) => {
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
  );
};

export default RadarPlot;
