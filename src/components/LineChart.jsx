import {
  Box,
  FormControl,
  MenuItem,
  Select,
  Typography,
  useTheme,
} from "@mui/material";
import { ResponsiveLine } from "@nivo/line";
import { useEffect, useMemo, useState } from "react";
import { tokens } from "../theme";

const LineChart = ({ weeks = [], week: externalWeek, setWeek: externalSetWeek }) => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const [metric, setMetric] = useState("energy");
  const [internalWeek, setInternalWeek] = useState(weeks[0] || "");

  const week = externalWeek !== undefined ? externalWeek : internalWeek;
  const setWeek = externalSetWeek || setInternalWeek;

  useEffect(() => {
    if (!weeks.includes(week)) {
      const first = weeks[0] || "";
      setWeek(first);
    }
  }, [weeks, week, setWeek]);

  const days = useMemo(() => {
    if (!week) return [];
    const start = new Date(week);
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      return {
        x: d.toLocaleDateString("en-US", { weekday: "short" }),
        y: 0,
      };
    });
  }, [week]);

  const data = useMemo(() => {
    if (!metric) return [];
    return [
      {
        id: metric,
        data: days,
      },
    ];
  }, [metric, days]);

  const getWeekNumber = (dateStr) => {
    const d = new Date(dateStr);
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + 4 - (d.getDay() || 7));
    const yearStart = new Date(d.getFullYear(), 0, 1);
    return Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
  };

  return (
    <Box display="flex" flexDirection="column" height="100%">
      <Box display="flex" justifyContent="space-between" alignItems="center">
        <Typography variant="h5" fontWeight="600" color={colors.grey[100]}>
          {metric === "energy" ? "Energy Price" : "Radiation"}
        </Typography>
        <Box display="flex" alignItems="center" gap={1}>
          <FormControl size="small">
            <Select
              value={metric}
              onChange={(e) => setMetric(e.target.value)}
              MenuProps={{ disableScrollLock: true }}
            >
              <MenuItem value="energy">Energy Price</MenuItem>
              <MenuItem value="radiation">Radiation</MenuItem>
            </Select>
          </FormControl>
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
      </Box>
      <Box flex="1" mt={1}>
        <ResponsiveLine
          data={data}
          margin={{ top: 20, right: 30, bottom: 50, left: 60 }}
          xScale={{ type: "point" }}
          yScale={{ type: "linear", min: 0, max: "auto", stacked: false }}
          axisTop={null}
          axisRight={null}
          axisBottom={{
            tickSize: 0,
            tickPadding: 5,
            tickRotation: 0,
          }}
          axisLeft={{
            tickValues: 5,
            tickSize: 3,
            tickPadding: 5,
            tickRotation: 0,
          }}
          enableGridX={false}
          enableGridY={false}
          colors={{ datum: "color" }}
          pointSize={6}
          pointColor={{ theme: "background" }}
          pointBorderWidth={2}
          pointBorderColor={{ from: "serieColor" }}
          useMesh={true}
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
              container: { color: colors.primary[500] },
            },
          }}
        />
      </Box>
    </Box>
  );
};

export default LineChart;
