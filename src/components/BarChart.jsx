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
      const entry = { date: dateStr };
      strategies.forEach((s) => (entry[s] = 0));
      (selectedCultivations || []).forEach((c) => {
        const vals = energyData[c]?.[week]?.[dateStr] || {};
        strategies.forEach((s) => {
          const v = Number(vals[s]);
          if (!isNaN(v)) entry[s] += v;
        });
      });
      days.push(entry);
    }
    return days;
  }, [energyData, week, strategies, selectedCultivations]);

  const maxValue = useMemo(
    () =>
      chartData.reduce((max, d) => {
        const total = strategies.reduce((sum, s) => sum + (d[s] || 0), 0);
        return Math.max(max, total);
      }, 0),
    [chartData, strategies]
  );

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
          keys={strategies}
          indexBy="date"
          margin={{ top: 20, right: 30, bottom: 50, left: 60 }}
          padding={0.3}
          groupMode="stacked"
          maxValue={maxValue || "auto"}
          valueScale={{ type: "linear" }}
          indexScale={{ type: "band", round: true }}
          colors={({ id }) => colorMap[id] || colors.greenAccent[500]}
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
              {strategies.map((s) => (
                <Typography key={s} variant="body2">
                  {s}: {data[s]}
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
