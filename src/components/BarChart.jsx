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

  const weeks = useMemo(() => Object.keys(energyData || {}), [energyData]);
  const [week, setWeek] = useState(weeks[0] || "");
  useEffect(() => {
    if (!week && weeks.length > 0) setWeek(weeks[0]);
  }, [weeks, week]);

  const strategies = useMemo(() => {
    const weekData = energyData[week] || {};
    const first = Object.values(weekData)[0] || {};
    return Object.keys(first);
  }, [energyData, week]);

  const chartData = useMemo(() => {
    const weekData = energyData[week] || {};
    if (strategies.length < 2) return [];
    return Object.entries(weekData).map(([date, vals]) => {
      const s1 = strategies[0];
      const s2 = strategies[1];
      const v1 = Number(vals[s1]) || 0;
      const v2 = Number(vals[s2]) || 0;
      const baselineStrategy = v1 <= v2 ? s1 : s2;
      const diffStrategy = v1 <= v2 ? s2 : s1;
      const baseline = Math.min(v1, v2);
      const difference = Math.abs(v1 - v2);
      return {
        date,
        baseline,
        difference,
        baselineStrategy,
        diffStrategy,
        [s1]: v1,
        [s2]: v2,
      };
    });
  }, [energyData, week, strategies]);

  const maxValue = useMemo(
    () =>
      chartData.reduce(
        (max, d) => Math.max(max, (d.baseline || 0) + (d.difference || 0)),
        0
      ),
    [chartData]
  );

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
          keys={["baseline", "difference"]}
          indexBy="date"
          margin={{ top: 20, right: 30, bottom: 50, left: 60 }}
          padding={0.3}
          groupMode="stacked"
          maxValue={maxValue || "auto"}
          valueScale={{ type: "linear" }}
          indexScale={{ type: "band", round: true }}
          colors={({ id, data }) => {
            const strategy = id === "baseline" ? data.baselineStrategy : data.diffStrategy;
            return colorMap[strategy] || colors.greenAccent[500];
          }}
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
