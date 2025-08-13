import {
  Box,
  FormControl,
  MenuItem,
  Select,
  Typography,
  useTheme,
} from "@mui/material";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import { ResponsiveBar } from "@nivo/bar";
import { ResponsiveLine } from "@nivo/line";
import { useState, useMemo, useEffect } from "react";
import { tokens } from "../theme";
import { useRadar } from "../radarplot/RadarControls";

const BarChart = ({ energyData = {} }) => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const radar = useRadar();
  const colorMap = radar?.colorMap || {};
  const { selectedCultivations = [], visible = {} } = radar || {};

  const [mode, setMode] = useState("weekly");

  const cultivations =
    selectedCultivations.length > 0
      ? selectedCultivations
      : Object.keys(energyData || {});

  const weeks = useMemo(() => {
    const set = new Set();
    cultivations.forEach((c) => {
      Object.keys(energyData[c] || {}).forEach((w) => set.add(w));
    });
    return Array.from(set).sort();
  }, [energyData, cultivations]);
  const [week, setWeek] = useState(weeks[0] || "");

  useEffect(() => {
    if (!weeks.includes(week)) setWeek(weeks[0] || "");
  }, [weeks, week]);
  const strategies = useMemo(() => {
    const set = new Set();
    cultivations.forEach((c) => {
      Object.entries(energyData[c] || {}).forEach(([w, weekData]) => {
        if (mode === "weekly" && w !== week) return;
        Object.values(weekData).forEach((vals) => {
          Object.keys(vals).forEach((s) => {
            if (visible[s]) set.add(s);
          });
        });
      });
    });
    return Array.from(set);
  }, [energyData, cultivations, visible, week, mode]);

  const rawData = useMemo(() => {
    if (mode !== "weekly" || !week) return [];
    const start = new Date(week);
    const days = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      const dateStr = d.toISOString().slice(0, 10);
      const values = {};
      strategies.forEach((s) => (values[s] = 0));
      cultivations.forEach((c) => {
        const vals = energyData[c]?.[week]?.[dateStr] || {};
        strategies.forEach((s) => {
          const v = Number(vals[s]);
          if (!isNaN(v)) values[s] += v;
        });
      });
      days.push({ date: dateStr, ...values });
    }
    return days;
  }, [mode, energyData, week, strategies, cultivations]);

  const strategyKeys = useMemo(
    () => strategies.map((_, i) => String(i)),
    [strategies]
  );

  const chartData = useMemo(() => {
    if (mode !== "weekly") return [];
    return rawData.map((day) => {
      const sorted = strategies
        .map((s) => ({ key: s, value: Number(day[s]) || 0 }))
        .sort((a, b) => a.value - b.value);
      let prev = 0;
      const entry = { date: day.date };
      sorted.forEach(({ key, value }, idx) => {
        entry[String(idx)] = value - prev;
        entry[`strategy_${idx}`] = key;
        prev = value;
      });
      return entry;
    });
  }, [mode, rawData, strategies]);

  const maxValue = useMemo(() => {
    if (mode !== "weekly") return 0;
    let max = 0;
    rawData.forEach((d) => {
      strategies.forEach((s) => {
        const v = Number(d[s]) || 0;
        if (v > max) max = v;
      });
    });
    return max;
  }, [mode, rawData, strategies]);

  const maxScale = maxValue > 0 ? maxValue * 1.1 : 0;
  const minScale = 0;

  const getWeekNumber = (dateStr) => {
    const d = new Date(dateStr);
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + 4 - (d.getDay() || 7));
    const yearStart = new Date(d.getFullYear(), 0, 1);
    return Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
  };

  const getWeekStart = (dateStr) => {
    const d = new Date(dateStr);
    if (isNaN(d)) return null;
    const day = d.getDay();
    const diff = (day + 6) % 7; // Monday as first day
    d.setDate(d.getDate() - diff);
    return d.toISOString().slice(0, 10);
  };

  const allDates = useMemo(() => {
    if (mode !== "cumulative") return [];
    const set = new Set();
    cultivations.forEach((c) => {
      Object.values(energyData[c] || {}).forEach((weekData) => {
        Object.keys(weekData).forEach((d) => set.add(d));
      });
    });
    return Array.from(set).sort();
  }, [mode, energyData, cultivations]);

  const cumulativeData = useMemo(() => {
    if (mode !== "cumulative") return [];
    const lines = strategies.map((s) => ({ id: s, data: [] }));
    const sums = strategies.reduce((acc, s) => {
      acc[s] = 0;
      return acc;
    }, {});
    allDates.forEach((date) => {
      const weekStart = getWeekStart(date);
      strategies.forEach((s, idx) => {
        let val = 0;
        cultivations.forEach((c) => {
          const v = energyData[c]?.[weekStart]?.[date]?.[s];
          const num = Number(v);
          if (!isNaN(num)) val += num;
        });
        sums[s] += val;
        lines[idx].data.push({ x: date, y: sums[s] });
      });
    });
    return lines;
  }, [mode, strategies, allDates, energyData, cultivations]);

  const chartTheme = {
    axis: {
      domain: { line: { stroke: colors.grey[100] } },
      legend: { text: { fill: colors.grey[100] } },
      ticks: {
        line: { stroke: colors.grey[100], strokeWidth: 1 },
        text: { fill: colors.grey[100] },
      },
    },
    legends: {
      text: { fill: colors.grey[100] },
    },
    tooltip: {
      container: {
        background: colors.primary[400],
      },
    },
  };

  return (
    <Box height="100%" display="flex" flexDirection="column">
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        px={2}
        pt={2}
      >
        <Typography variant="h5" fontWeight="600">
          Energy cost
        </Typography>
        <Box display="flex" alignItems="center" gap={1}>
          <ToggleButtonGroup
            value={mode}
            exclusive
            size="small"
            onChange={(e, v) => {
              if (v) setMode(v);
            }}
          >
            <ToggleButton value="weekly">Weekly</ToggleButton>
            <ToggleButton value="cumulative">Cumulative</ToggleButton>
          </ToggleButtonGroup>
          {mode === "weekly" && weeks.length > 0 && (
            <FormControl size="small">
              <Select
                value={week}
                onChange={(e) => setWeek(e.target.value)}
                MenuProps={{ disableScrollLock: true }}
              >
                {weeks.map((w) => (
                  <MenuItem key={w} value={w}>
                    {`Week ${getWeekNumber(w)}`}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}
        </Box>
      </Box>
      <Box flex="1" mt={1}>
        {mode === "weekly" ? (
          <ResponsiveBar
            data={chartData}
            keys={strategyKeys}
            indexBy="date"
            margin={{ top: 20, right: 30, bottom: 50, left: 60 }}
            padding={0.3}
            groupMode="stacked"
            minValue={minScale}
            maxValue={maxScale}
            valueScale={{ type: "linear" }}
            indexScale={{ type: "band", round: true }}
            colors={({ id, data }) =>
              colorMap[data[`strategy_${id}`]] || colors.greenAccent[500]
            }
            axisTop={null}
            axisRight={null}
            axisBottom={{
              tickSize: 5,
              tickPadding: 5,
              tickRotation: 0,
              legend: "Day",
              legendPosition: "middle",
              legendOffset: 32,
              format: (value) =>
                new Date(value).toLocaleDateString(undefined, {
                  weekday: "short",
                }),
            }}
            axisLeft={{
              tickSize: 5,
              tickPadding: 5,
              tickRotation: 0,
              legend: "€",
              legendPosition: "middle",
              legendOffset: -40,
              format: (value) => Number(value).toFixed(3),
            }}
            enableLabel={false}
            theme={chartTheme}
            tooltip={({ data }) => {
              let cumulative = 0;
              return (
                <Box p={1}>
                  <Typography variant="body2">{data.date}</Typography>
                  {strategyKeys.map((key) => {
                    const name = data[`strategy_${key}`];
                    if (!name) return null;
                    const val = Number(data[key] || 0);
                    cumulative += val;
                    return (
                      <Typography key={key} variant="body2">
                        {name}: {cumulative.toFixed(3)}
                      </Typography>
                    );
                  })}
                </Box>
              );
            }}
          />
        ) : (
          <ResponsiveLine
            data={cumulativeData}
            margin={{ top: 20, right: 30, bottom: 50, left: 60 }}
            xScale={{ type: "point" }}
            yScale={{ type: "linear", min: "auto", max: "auto" }}
            axisTop={null}
            axisRight={null}
            axisBottom={{
              tickSize: 5,
              tickPadding: 5,
              tickRotation: 0,
              legend: "Day",
              legendPosition: "middle",
              legendOffset: 36,
              format: (value) =>
                new Date(value).toLocaleDateString(undefined, {
                  month: "short",
                  day: "numeric",
                }),
            }}
            axisLeft={{
              tickSize: 5,
              tickPadding: 5,
              tickRotation: 0,
              legend: "€",
              legendPosition: "middle",
              legendOffset: -40,
              format: (value) => Number(value).toFixed(3),
            }}
            colors={({ id }) => colorMap[id] || colors.greenAccent[500]}
            theme={chartTheme}
            enablePoints={false}
            useMesh={true}
            tooltip={({ point }) => (
              <Box p={1}>
                <Typography variant="body2">{point.data.x}</Typography>
                <Typography variant="body2">
                  {`${point.serieId}: ${Number(point.data.y).toFixed(3)}`}
                </Typography>
              </Box>
            )}
          />
        )}
      </Box>
    </Box>
  );
};

export default BarChart;
