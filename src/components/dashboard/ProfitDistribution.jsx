import React, { useState, useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  LabelList,
} from "recharts";
import { Box, IconButton, useTheme } from "@mui/material";
import OpenInFullIcon from "@mui/icons-material/OpenInFull";
import CloseIcon from "@mui/icons-material/Close";
import { tokens } from "../../theme";

const ProfitDistribution = ({
  selectedCultivation,
  selectedStrategies = [],
  data = {},
  colorMap = {},
}) => {
  const [mode, setMode] = useState("count");
  const [expanded, setExpanded] = useState(false);
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);

  // Require a single cultivation and at least one strategy
  if (!selectedCultivation || selectedStrategies.length === 0) {
    return (
      <div className="p-4 text-center">
        <p className="text-sm">
          Select a cultivation and at least one strategy to view the profit distribution.
        </p>
      </div>
    );
  }

  const formatWeight = (val) =>
    val !== null && val !== undefined ? `${val}g` : "?g";

  const resolveWeight = (entry, ...keys) => {
    for (const k of keys) {
      if (
        entry.targets &&
        entry.targets[k] !== undefined &&
        entry.targets[k] !== null
      )
        return entry.targets[k];
      if (entry[k] !== undefined && entry[k] !== null) return entry[k];
    }
    return null;
  };

  const prepared = selectedStrategies
    .map((strategy) => {
      const key = `${selectedCultivation}|${strategy}`;
      const entry = data[key] || {};
      const distObj = entry.distribution;

      if (
        !distObj ||
        typeof distObj !== "object" ||
        Object.keys(distObj).length === 0
      ) {
        return null;
      }

      const target = resolveWeight(
        entry,
        "target_weight",
        "target",
        "target_weight_g",
        "targetWeight"
      );
      const lowerCap = resolveWeight(
        entry,
        "lower_cap",
        "lower",
        "lower_cap_weight",
        "lowerCap"
      );
      const bonusCap = resolveWeight(
        entry,
        "upper_cap",
        "bonus_cap",
        "upper",
        "upper_cap_weight",
        "upperCap"
      );

      const distribution = Object.entries(distObj)
        .map(([bin, count]) => ({
          bin: parseInt(bin, 10),
          count: Number(count),
        }))
        .filter((d) => d.count > 0)
        .sort((a, b) => a.bin - b.bin);

      const totalPlants = distribution.reduce((sum, d) => sum + d.count, 0);
      const baseRevenue = Number(entry.base_revenue) || 0;
      const bonusPenalty = Number(entry.bonus_penalty) || 0;
      const effectivePrice =
        totalPlants > 0 ? (baseRevenue + bonusPenalty) / totalPlants : 0;

      return {
        strategy,
        distribution,
        target,
        lowerCap,
        bonusCap,
        color: colorMap[strategy] || "#8884d8",
        effectivePrice,
      };
    })
    .filter(Boolean);

  const allBins = Array.from(
    new Set(prepared.flatMap((p) => p.distribution.map((d) => d.bin)))
  ).sort((a, b) => a - b);

  if (prepared.length === 0 || allBins.length === 0) {
    return (
      <div className="p-4 text-center">
        <p className="text-sm">No distribution data available.</p>
      </div>
    );
  }

  const chartData = useMemo(() => {
    return allBins.map((bin) => {
      const item = { bin };
      prepared.forEach((p) => {
        const found = p.distribution.find((d) => d.bin === bin);
        const count = found ? found.count : null;
        item[p.strategy] =
          count === null
            ? null
            : mode === "profit"
            ? count * p.effectivePrice
            : count;
      });
      return item;
    });
  }, [allBins, prepared, mode]);
  const ChartContent = ({ actionButton }) => (
    <div className="flex flex-col h-full w-full">
      <div className="flex items-center justify-between border-b border-gray-600 p-4">
        <h2 className="text-lg font-semibold">Profit Distribution by Weight</h2>
        <div className="flex items-center gap-2">
          <select
            className="bg-gray-700 text-white text-sm p-1 rounded"
            value={mode}
            onChange={(e) => setMode(e.target.value)}
          >
            <option value="count">Count</option>
            <option value="profit">Profit</option>
          </select>
          {actionButton}
        </div>
      </div>
      <div className="p-4 text-sm flex flex-wrap gap-4 items-center">
        {prepared.map((p) => (
          <div key={p.strategy} className="flex items-center gap-2">
            <span
              className="w-3 h-3 rounded-sm"
              style={{ backgroundColor: p.color }}
            ></span>
            <span className="font-semibold">{p.strategy}</span>
          </div>
        ))}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1">
            <span>🎯</span>
            <span>{formatWeight(prepared[0].target)}</span>
          </div>
          <div className="flex items-center gap-1">
            <span>⏬</span>
            <span>{formatWeight(prepared[0].lowerCap)}</span>
          </div>
          <div className="flex items-center gap-1">
            <span>⏫</span>
            <span>{formatWeight(prepared[0].bonusCap)}</span>
          </div>
        </div>
      </div>
      <div className="flex-grow p-4 min-h-0">
        <div style={{ width: "100%", height: "100%" }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
              barGap={0}
              barCategoryGap="0%"
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="bin"
                label={{ value: "Weight (g)", position: "insideBottom", dy: 10 }}
              />
              <YAxis
                label={{
                  value: mode === "count" ? "Count" : "Profit (€)",
                  angle: -90,
                  dx: -10,
                }}
                tickFormatter={(v) =>
                  mode === "count"
                    ? v >= 1000
                      ? `${v / 1000}k`
                      : v
                    : `€${v.toFixed(2)}`
                }
              />
              <Tooltip
                formatter={(value) =>
                  mode === "profit" ? `€${value.toFixed(2)}` : value
                }
              />
              {prepared.map((p) => (
                <Bar
                  key={p.strategy}
                  dataKey={p.strategy}
                  isAnimationActive
                  animationDuration={800}
                  fill={p.color}
                >
                  <LabelList
                    dataKey={p.strategy}
                    position="top"
                    className="text-xs"
                    formatter={(val) =>
                      mode === "profit" && val !== null
                        ? `€${val.toFixed(2)}`
                        : val
                    }
                  />
                </Bar>
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
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

export default ProfitDistribution;
