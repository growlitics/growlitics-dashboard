import { Box, Button, IconButton, Typography, useTheme } from "@mui/material";
import { useEffect, useState, useMemo } from "react";
import { tokens } from "../../theme";
import { mockTransactions } from "../../data/mockData";
import DownloadOutlinedIcon from "@mui/icons-material/DownloadOutlined";
import EuroSymbolIcon from "@mui/icons-material/EuroSymbol";
import LocalFloristIcon from "@mui/icons-material/LocalFlorist";
import BoltIcon from "@mui/icons-material/Bolt";
import SavingsIcon from "@mui/icons-material/Savings";
import Header from "../../components/Header";
import LineChart from "../../components/LineChart";
import BarChart from "../../components/BarChart";
import StatBox from "../../components/StatBox";
import RadarPlot from "../../radarplot/RadarPlot";
import RadarControls, { RadarProvider, useRadar } from "../../radarplot/RadarControls";

// Fallback to the public admin gist when no environment variable is provided
const DEFAULT_GIST_ID =
  process.env.REACT_APP_DEFAULT_GIST_ID || "58caf316abf501f85f83f128909cbc4d";

const normalizeKpiData = (data) => {
  if (!Array.isArray(data)) return data;

  return data.reduce((acc, entry) => {
    if (!entry) return acc;
    const { cultivation, ...rest } = entry;
    if (!cultivation) return acc;

    const strategyName = rest.name || rest.strategy;
    const strategy = { ...rest };
    if (strategyName) strategy.name = strategyName;
    delete strategy.strategy;

    if (!acc[cultivation]) acc[cultivation] = [];
    acc[cultivation].push(strategy);
    return acc;
  }, {});
};

const getWeekStart = (dateStr) => {
  const d = new Date(dateStr);
  if (isNaN(d)) return null;
  const day = d.getDay();
  const diff = (day + 6) % 7; // Monday as first day
  d.setDate(d.getDate() - diff);
  return d.toISOString().slice(0, 10);
};

const buildEnergyData = (kpis = {}) => {
  const energy = {};
  Object.entries(kpis).forEach(([key, data]) => {
    const [cultivation, strategy] = key.split("|");
    const daily = data?.daily || [];
    daily.forEach((entry) => {
      const { date, total_energy_cost } = entry || {};
      if (!date) return;
      const week = getWeekStart(date);
      if (!week) return;
      if (!energy[cultivation]) energy[cultivation] = {};
      if (!energy[cultivation][week]) energy[cultivation][week] = {};
      if (!energy[cultivation][week][date]) energy[cultivation][week][date] = {};
      energy[cultivation][week][date][strategy] = Number(total_energy_cost) || 0;
    });
  });
  return energy;
};

const DashboardContent = ({ energyData }) => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const radar = useRadar();

  const {
    selectedCultivations = [],
    visible = {},
    kpis = {},
    colorMap = {},
  } = radar || {};

  const roundToThree = (n) => Math.round((n + Number.EPSILON) * 1000) / 1000;

  const strategyKpis = useMemo(() => {
    const result = {};
    const strategies = Object.keys(visible || {}).filter((s) => visible[s]);

    strategies.forEach((strategy) => {
      const totals = {
        euro_per_kwh: 0,
        kwh_per_gram: 0,
        euro_per_gram: 0,
        profit: 0,
      };
      let count = 0;

      selectedCultivations.forEach((cultivation) => {
        const data = kpis ? kpis[`${cultivation}|${strategy}`] : undefined;
        if (data) {
          Object.keys(totals).forEach((key) => {
            const val = Number(data[key]);
            if (!isNaN(val)) {
              totals[key] += val;
            }
          });
          count += 1;
        }
      });

      const averages = {};
      Object.keys(totals).forEach((key) => {
        averages[key] = count > 0 ? roundToThree(totals[key] / count) : null;
      });
      result[strategy] = averages;
    });

    return result;
  }, [selectedCultivations, visible, kpis]);

  const formatValue = (val) =>
    val !== null && val !== undefined ? roundToThree(val).toFixed(3) : "";

  const buildLines = (key) =>
    Object.entries(strategyKpis)
      .map(([strategy, values]) => {
        const val = values[key];
        if (val === null || val === undefined) return null;
        return {
          label: formatValue(val),
          color: colorMap[strategy] || colors.grey[100],
        };
      })
      .filter(Boolean);

  return (
    <Box m="20px">
      {/* HEADER */}
      <Box display="flex" justifyContent="space-between" alignItems="center">
        <Box display="flex" alignItems="center" gap="20px">
          <Header title="GROWLITICS" subtitle="Turning data into ROI" />
          <RadarControls />
        </Box>

        <Box>
          <Button
            sx={{
              backgroundColor: colors.blueAccent[700],
              color: colors.grey[100],
              fontSize: "14px",
              fontWeight: "bold",
              padding: "10px 20px",
            }}
          >
            <DownloadOutlinedIcon sx={{ mr: "10px" }} />
            Download Reports
          </Button>
        </Box>
      </Box>

      {/* GRID & CHARTS */}
      <Box
        display="grid"
        gridTemplateColumns="repeat(12, 1fr)"
        gridAutoRows="140px"
        gap="20px"
      >
        {/* ROW 1 */}
        <Box
          gridColumn="span 3"
          backgroundColor={colors.primary[400]}
          display="flex"
          alignItems="center"
          justifyContent="center"
        >
          <StatBox
            lines={buildLines("profit")}
            subtitle="Total Profit (€)"
            icon={
              <EuroSymbolIcon
                sx={{ color: colors.greenAccent[600], fontSize: "26px" }}
              />
            }
          />
        </Box>
        <Box
          gridColumn="span 3"
          backgroundColor={colors.primary[400]}
          display="flex"
          alignItems="center"
          justifyContent="center"
        >
          <StatBox
            lines={buildLines("kwh_per_gram")}
            subtitle="Plant Efficiency (kWh/g)"
            icon={
              <LocalFloristIcon
                sx={{ color: colors.greenAccent[600], fontSize: "26px" }}
              />
            }
          />
        </Box>
        <Box
          gridColumn="span 3"
          backgroundColor={colors.primary[400]}
          display="flex"
          alignItems="center"
          justifyContent="center"
        >
          <StatBox
            lines={buildLines("euro_per_kwh")}
            subtitle="Energy Efficiency (€/kWh)"
            icon={
              <BoltIcon
                sx={{ color: colors.greenAccent[600], fontSize: "26px" }}
              />
            }
          />
        </Box>
        <Box
          gridColumn="span 3"
          backgroundColor={colors.primary[400]}
          display="flex"
          alignItems="center"
          justifyContent="center"
        >
          <StatBox
            lines={buildLines("euro_per_gram")}
            subtitle="Cost Efficiency (€/g)"
            icon={
              <SavingsIcon
                sx={{ color: colors.greenAccent[600], fontSize: "26px" }}
              />
            }
          />
        </Box>

        {/* ROW 2 */}
        <Box
          gridColumn="span 8"
          gridRow="span 2"
          backgroundColor={colors.primary[400]}
        >
          <Box
            mt="25px"
            p="0 30px"
            display="flex "
            justifyContent="space-between"
            alignItems="center"
          >
            <Box>
              <Typography
                variant="h5"
                fontWeight="600"
                color={colors.grey[100]}
              >
                Revenue Generated
              </Typography>
              <Typography
                variant="h3"
                fontWeight="bold"
                color={colors.greenAccent[500]}
              >
                $59,342.32
              </Typography>
            </Box>
            <Box>
              <IconButton>
                <DownloadOutlinedIcon
                  sx={{ fontSize: "26px", color: colors.greenAccent[500] }}
                />
              </IconButton>
            </Box>
          </Box>
          <Box height="250px" m="-20px 0 0 0">
            <LineChart isDashboard={true} />
          </Box>
        </Box>
        <Box
          gridColumn="span 4"
          gridRow="span 2"
          backgroundColor={colors.primary[400]}
          overflow="auto"
        >
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
            borderBottom={`4px solid ${colors.primary[500]}`}
            colors={colors.grey[100]}
            p="15px"
          >
            <Typography color={colors.grey[100]} variant="h5" fontWeight="600">
              Recent Transactions
            </Typography>
          </Box>
          {mockTransactions.map((transaction, i) => (
            <Box
              key={`${transaction.txId}-${i}`}
              display="flex"
              justifyContent="space-between"
              alignItems="center"
              borderBottom={`4px solid ${colors.primary[500]}`}
              p="15px"
            >
              <Box>
                <Typography
                  color={colors.greenAccent[500]}
                  variant="h5"
                  fontWeight="600"
                >
                  {transaction.txId}
                </Typography>
                <Typography color={colors.grey[100]}>
                  {transaction.user}
                </Typography>
              </Box>
              <Box color={colors.grey[100]}>{transaction.date}</Box>
              <Box
                backgroundColor={colors.greenAccent[500]}
                p="5px 10px"
                borderRadius="4px"
              >
                ${transaction.cost}
              </Box>
            </Box>
          ))}
        </Box>

        {/* ROW 3 */}
        <Box
          gridColumn="5 / span 4"
          gridRow="span 2"
          backgroundColor={colors.primary[400]}
          display="flex"
          flexDirection="column"
        >
          <BarChart energyData={energyData} />
        </Box>
        <Box
          gridColumn="9 / span 4"
          gridRow="span 2"
          backgroundColor={colors.primary[400]}
          className="w-full h-full p-4"
        >
          <RadarPlot {...radar} />
        </Box>
      </Box>
    </Box>
  );
};

const Dashboard = () => {
  const [gistData, setGistData] = useState(null);
  const [energyData, setEnergyData] = useState({});
  const [batches, setBatches] = useState([]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const gistIdParam = params.get("gist");
    const dataParam = params.get("data");
    const dataUrl = params.get("data_url");
    const batchesParam = params.get("batches");
    const gistId = gistIdParam || DEFAULT_GIST_ID;

    const processFetchedData = (parsed) => {
      if (!parsed) return;
      if (Array.isArray(parsed)) {
        setGistData(normalizeKpiData(parsed));
        return;
      }
      const {
        daily_energy_cost,
        energy_cost_daily,
        energyData: energyField,
        dailyEnergyCost,
        ...kpiPayload
      } = parsed;
      const normalized = normalizeKpiData(kpiPayload);
      setGistData(normalized);
      const energy =
        daily_energy_cost ||
        energy_cost_daily ||
        energyField ||
        dailyEnergyCost ||
        buildEnergyData(normalized?.kpis);
      if (energy) setEnergyData(energy);
    };

    if (batchesParam) {
      const parsedBatches = batchesParam
        .split(",")
        .map((b) => b.trim())
        .filter(Boolean);
      setBatches(parsedBatches);
    }

    if (dataParam) {
      try {
        const parsed = JSON.parse(decodeURIComponent(dataParam));
        processFetchedData(parsed);
      } catch (err) {
        console.error("Failed to parse data param", err);
      }
      return;
    }

    if (dataUrl) {
      const fetchDataUrl = async () => {
        try {
          const res = await fetch(dataUrl);
          const json = await res.json();
          processFetchedData(json);
        } catch (err) {
          console.error("Failed to fetch data_url JSON", err);
        }
      };

      fetchDataUrl();
      return;
    }

    if (!gistId) return;

    const fetchData = async () => {
      try {
        const res = await fetch(`https://api.github.com/gists/${gistId}`);
        const json = await res.json();
        const files = json.files || {};
        const firstFile = Object.values(files)[0];
        if (firstFile && firstFile.content) {
          try {
            const parsed = JSON.parse(firstFile.content);
            processFetchedData(parsed);
          } catch (err) {
            console.error("Failed to parse gist JSON", err);
          }
        }
      } catch (err) {
        console.error("Failed to fetch gist", err);
      }
    };

    fetchData();
  }, []);

  return (
    <RadarProvider data={gistData} batches={batches}>
      <DashboardContent energyData={energyData} />
    </RadarProvider>
  );
};

export default Dashboard;
