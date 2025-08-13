import {
  Box,
  FormControl,
  MenuItem,
  Select,
  Typography,
  useTheme,
  IconButton,
} from "@mui/material";
import OpenInFullIcon from "@mui/icons-material/OpenInFull";
import CloseIcon from "@mui/icons-material/Close";
import { ResponsiveLine } from "@nivo/line";
import { useEffect, useMemo, useState } from "react";
import { tokens } from "../theme";
import { useRadar } from "../radarplot/RadarControls";

const LineChart = ({ weeks = [], week: externalWeek, setWeek: externalSetWeek }) => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const radar = useRadar();
  const { selectedCultivations = [], visible = {}, kpis = {} } = radar || {};
  const [metric, setMetric] = useState("energy");
  const [internalWeek, setInternalWeek] = useState(weeks[0] || "");
  const [expanded, setExpanded] = useState(false);

  const week = externalWeek !== undefined ? externalWeek : internalWeek;
  const setWeek = externalSetWeek || setInternalWeek;

  useEffect(() => {
    if (!weeks.includes(week)) {
      const first = weeks[0] || "";
      setWeek(first);
    }
  }, [weeks, week, setWeek]);

  const activeStrategies = useMemo(
    () => Object.keys(visible || {}).filter((s) => visible[s]),
    [visible]
  );

  const aggregated = useMemo(() => {
    const result = {};
    selectedCultivations.forEach((c) => {
      activeStrategies.forEach((s) => {
        const daily = kpis?.[`${c}|${s}`]?.daily || [];
        daily.forEach((entry) => {
          const date = entry?.date;
          if (!date) return;
          if (!result[date])
            result[date] = {
              energy: { sum: 0, count: 0 },
              radiation: { sum: 0, count: 0 },
            };
          const energyKeys = [
            "avg_energy_price",
            "energy_price",
            "energy_price_avg",
            "euro_per_kwh",
          ];
          let eVal = null;
          for (const k of energyKeys) {
            const v = Number(entry?.[k]);
            if (!isNaN(v)) {
              eVal = v;
              break;
            }
          }
          if (eVal !== null) {
            result[date].energy.sum += eVal;
            result[date].energy.count += 1;
          }
          const radKeys = ["radiation", "avg_radiation", "daily_radiation"];
          let rVal = null;
          for (const k of radKeys) {
            const v = Number(entry?.[k]);
            if (!isNaN(v)) {
              rVal = v;
              break;
            }
          }
          if (rVal !== null) {
            result[date].radiation.sum += rVal;
            result[date].radiation.count += 1;
          }
        });
      });
    });
    const averages = {};
    Object.entries(result).forEach(([date, vals]) => {
      averages[date] = {
        energy:
          vals.energy.count > 0 ? vals.energy.sum / vals.energy.count : 0,
        radiation:
          vals.radiation.count > 0
            ? vals.radiation.sum / vals.radiation.count
            : 0,
      };
    });
    return averages;
  }, [selectedCultivations, activeStrategies, kpis]);

  const days = useMemo(() => {
    if (!week) return [];
    const start = new Date(week);
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      const dateStr = d.toISOString().slice(0, 10);
      const val = aggregated[dateStr]?.[metric] || 0;
      return {
        x: d.toLocaleDateString("en-US", { weekday: "short" }),
        y: val,
      };
    });
  }, [week, aggregated, metric]);

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
  const ChartContent = ({ actionButton }) => (
    <Box height="100%" display="flex" flexDirection="column">
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        px={2}
        pt={2}
      >
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
          {actionButton}
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
          axisBottom={{ tickSize: 0, tickPadding: 5, tickRotation: 0 }}
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
            legends: { text: { fill: colors.grey[100] } },
            tooltip: { container: { color: colors.primary[500] } },
          }}
        />
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

export default LineChart;
