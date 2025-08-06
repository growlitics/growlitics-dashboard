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

  const chartData = useMemo(() => {
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

      const entries = Object.entries(values);
      entries.sort((a, b) => a[1] - b[1]);
      const minPair = entries[0] || [null, 0];
      const maxPair = entries[entries.length - 1] || minPair;
      const base = minPair[1];
      const diff = Math.max(0, maxPair[1] - minPair[1]);
      days.push({
        date: dateStr,
        base,
        diff,
        baseStrategy: minPair[0],
        diffStrategy: maxPair[0],
        values,
      });
    }
    return days;
  }, [energyData, week, strategies, selectedCultivations]);

  const { minValue, maxValue } = useMemo(() => {
    if (!chartData.length) return { minValue: 0, maxValue: 0 };
    let min = Infinity;
    let max = -Infinity;
    chartData.forEach((d) => {
      const dayMin = d.base ?? 0;
      const dayMax = (d.base ?? 0) + (d.diff ?? 0);
      if (dayMin < min) min = dayMin;
      if (dayMax > max) max = dayMax;
    });
    if (min === Infinity) min = 0;
    if (max === -Infinity) max = 0;
    return { minValue: min, maxValue: max };
  }, [chartData]);

  const maxScale = maxValue > 0 ? maxValue * 1.1 : 0;
  const minScale = minValue < 0 ? minValue * 1.1 : 0;

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
          keys={["base", "diff"]}
          indexBy="date"
          margin={{ top: 20, right: 30, bottom: 50, left: 60 }}
          padding={0.3}
          groupMode="stacked"
          minValue={minScale}
          maxValue={maxScale}
          valueScale={{ type: "linear" }}
          indexScale={{ type: "band", round: true }}
          colors={({ id, data }) => {
            if (id === "base")
              return colorMap[data.baseStrategy] || colors.greenAccent[500];
            if (id === "diff")
              return colorMap[data.diffStrategy] || colors.greenAccent[300];
            return colors.greenAccent[500];
          }}
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
          tooltip={({ data }) => (
            <Box p={1}>
              <Typography variant="body2">{data.date}</Typography>
              {Object.entries(data.values || {}).map(([s, v]) => (
                <Typography key={s} variant="body2">
                  {s}: {Number(v).toFixed(3)}
                </Typography>
              ))}
            </Box>
          )}
        />
      </Box>
    </Box>
  );
};

export default BarChart;
