import { useMemo, useState } from "react";
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
} from "recharts";
import { Box, IconButton, useTheme } from "@mui/material";
import OpenInFullIcon from "@mui/icons-material/OpenInFull";
import CloseIcon from "@mui/icons-material/Close";
import { tokens } from "../theme";

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
          fontSize={22}
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
      fontSize={18}
    >
      {payload.value}
    </text>
  );
};

const ProfitBar = ({ strategies = [], visible = {}, colorMap = {} }) => {
  const profits = strategies
    .filter((s) => visible[s.name])
    .map((s) => Number(s.profit_per_m2) || 0);
  const rawMin = Math.min(...profits);
  const rawMax = Math.max(...profits);
  const min = profits.length ? rawMin - 2 : 0;
  const max = profits.length ? rawMax + 2 : 2;
  const range = max - min || 1;
  return (
    <div className="flex flex-col items-center justify-center h-full w-20 mr-4">
      <div className="relative w-2 h-5/6 bg-gray-400 rounded">
        {strategies
          .filter((s) => visible[s.name])
          .map((s) => {
            const raw = Number(s.profit_per_m2) || 0;
            const value = Math.min(Math.max(raw, min), max);
            const percent = ((value - min) / range) * 100;
            const color = colorMap[s.name] || "#999";
            return (
              <div
                key={s.name}
                className="absolute flex items-center"
                style={{
                  bottom: `${percent}%`,
                  left: "50%",
                  transform: "translate(-50%, 50%)",
                }}
              >
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: color }}
                  title={`${s.name}: ${Math.round(raw)}`}
                />
              </div>
            );
          })}
        <div className="absolute -left-6 -bottom-2 text-sm">{Math.round(min)}</div>
        <div className="absolute -left-6 -top-2 text-sm">{Math.round(max)}</div>
      </div>
    </div>
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
  const [expanded, setExpanded] = useState(false);
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);

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

  const Chart = () => (
    <div className="w-full h-full flex items-center justify-center">
      <div className="flex w-full h-full items-center">
        <ProfitBar strategies={strategies} visible={visible} colorMap={colorMap} />
        <div className="flex-1 h-full">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart
              cx="50%"
              cy="50%"
              outerRadius="80%"
              data={chartData}
              margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
            >
              <PolarGrid stroke="currentColor" strokeOpacity={0.2} />
              <PolarAngleAxis
                dataKey="metric"
                tick={renderAngleTick}
                tickLine={false}
              />
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
      </div>
    </div>
  );

  const ChartContent = ({ actionButton }) => (
    <Box position="relative" width="100%" height="100%">
      <Chart />
      <Box position="absolute" top={8} right={8} zIndex={10}>
        {actionButton}
      </Box>
    </Box>
  );

  return (
    <>
      <ChartContent
        actionButton={
          <IconButton size="small" onClick={() => setExpanded(true)}>
            <OpenInFullIcon fontSize="inherit" />
          </IconButton>
        }
      />
      {expanded && (
        <Box
          position="fixed"
          top={0}
          left={0}
          width="100%"
          height="100%"
          display="flex"
          justifyContent="center"
          alignItems="center"
          bgcolor="rgba(0,0,0,0.7)"
          zIndex={1300}
        >
          <Box
            position="relative"
            width="90%"
            height="90%"
            bgcolor={colors.primary[400]}
            p={2}
          >
            <ChartContent
              actionButton={
                <IconButton size="small" onClick={() => setExpanded(false)}>
                  <CloseIcon fontSize="inherit" />
                </IconButton>
              }
            />
          </Box>
        </Box>
      )}
    </>
  );
};

export default RadarPlot;

