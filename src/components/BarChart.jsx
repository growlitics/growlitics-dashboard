import { Box, FormControl, MenuItem, Select, Typography, useTheme } from "@mui/material";
import { ResponsiveBar } from "@nivo/bar";
import { useState, useMemo, useEffect } from "react";
import { tokens } from "../theme";
import { useRadar } from "../radarplot/RadarControls";

const BarChart = ({ energyData = {} }) => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const radar = useRadar();
  const colorMap = radar?.colorMap || {};
  const { selectedCultivations = [], visible = {} } = radar || {};

  const weeks = useMemo(() => {
    const set = new Set();
    const cultivations =
      selectedCultivations.length > 0
        ? selectedCultivations
        : Object.keys(energyData || {});
    cultivations.forEach((c) => {
      Object.keys(energyData[c] || {}).forEach((w) => set.add(w));
    });
    return Array.from(set).sort();
  }, [energyData, selectedCultivations]);
  const [week, setWeek] = useState(weeks[0] || "");

  useEffect(() => {
    if (!weeks.includes(week)) setWeek(weeks[0] || "");
  }, [weeks, week]);

  const strategies = useMemo(() => {
    const set = new Set();
    (selectedCultivations || []).forEach((c) => {
      const weekData = energyData[c]?.[week] || {};
      Object.values(weekData).forEach((vals) => {
        Object.keys(vals).forEach((s) => {
          if (visible[s]) set.add(s);
        });
      });
    });
    return Array.from(set);
  }, [energyData, week, selectedCultivations, visible]);

  const rawData = useMemo(() => {
    if (!week) return [];
    const start = new Date(week);
    const days = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      const dateStr = d.toISOString().slice(0, 10);
      const values = {};
      strategies.forEach((s) => (values[s] = 0));
      (selectedCultivations || []).forEach((c) => {
        const vals = energyData[c]?.[week]?.[dateStr] || {};
        strategies.forEach((s) => {
          const v = Number(vals[s]);
          if (!isNaN(v)) values[s] += v;
        });
      });
      days.push({ date: dateStr, ...values });
    }
    return days;
  }, [energyData, week, strategies, selectedCultivations]);

  const strategyKeys = useMemo(
    () => strategies.map((_, i) => String(i)),
    [strategies]
  );

  const chartData = useMemo(() => {
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
  }, [rawData, strategies]);

  const maxValue = useMemo(() => {
    let max = 0;
    rawData.forEach((d) => {
      strategies.forEach((s) => {
        const v = Number(d[s]) || 0;
        if (v > max) max = v;
      });
    });
    return max;
  }, [rawData, strategies]);

  const maxScale = maxValue > 0 ? maxValue * 1.1 : 0;
  const minScale = 0;

  const getWeekNumber = (dateStr) => {
    const d = new Date(dateStr);
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + 4 - (d.getDay() || 7));
    const yearStart = new Date(d.getFullYear(), 0, 1);
    return Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
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
        {weeks.length > 0 && (
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
      <Box flex="1" mt={1}>
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
          theme={{
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
          }}
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
      </Box>
    </Box>
  );
};

export default BarChart;
