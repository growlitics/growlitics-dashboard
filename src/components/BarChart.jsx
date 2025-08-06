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

  const weeks = useMemo(
    () => Object.keys(energyData || {}).sort((a, b) => Number(a) - Number(b)),
    [energyData]
  );
  const [week, setWeek] = useState(weeks[0] || "");
  useEffect(() => {
    if ((!week && weeks.length > 0) || (week && !weeks.includes(week))) {
      setWeek(weeks[0] || "");
    }
  }, [weeks, week]);

  const strategies = useMemo(() => {
    const weekData = energyData[week] || {};
    const first = Object.values(weekData)[0] || {};
    return Object.entries(first)
      .map(([s, v]) => ({ s, v: Number(v) || 0 }))
      .sort((a, b) => a.v - b.v)
      .map((e) => e.s);
  }, [energyData, week]);

  const chartData = useMemo(() => {
    const weekData = energyData[week] || {};
    return Object.entries(weekData).map(([date, vals]) => {
      const entries = strategies.map((s) => ({
        s,
        v: Number(vals[s]) || 0,
      }));
      const stacked = {};
      const raw = {};
      entries.forEach((e, idx) => {
        raw[e.s] = e.v;
        if (idx === 0) stacked[e.s] = e.v;
        else stacked[e.s] = e.v - entries[idx - 1].v;
      });
      return { date, ...stacked, raw };
    });
  }, [energyData, week, strategies]);

  const maxValue = useMemo(() => {
    return chartData.reduce((max, d) => {
      const vals = Object.values(d.raw || {});
      const highest = vals.length > 0 ? Math.max(...vals) : 0;
      return Math.max(max, highest);
    }, 0);
  }, [chartData]);

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
                  {`Week ${w}`}
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
            legend: "Date",
            legendPosition: "middle",
            legendOffset: 32,
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
                  {s}: {data.raw?.[s]}
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
