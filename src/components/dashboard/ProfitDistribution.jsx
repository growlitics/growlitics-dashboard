import React, { useState } from "react";
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

const ProfitDistribution = ({
  selectedCultivation,
  selectedStrategies = [],
  data = {},
  colorMap = {},
}) => {
  const [mode, setMode] = useState("count");

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

  return (
    <div className="flex flex-col h-full w-full">
      <div className="flex items-center justify-between border-b border-gray-600 p-4">
        <h2 className="text-lg font-semibold">Profit Distribution by Weight</h2>
        <select
          className="bg-gray-700 text-white text-sm p-1 rounded"
          value={mode}
          onChange={(e) => setMode(e.target.value)}
        >
          <option value="count">Count</option>
          <option value="revenue" disabled>
            Revenue (todo)
          </option>
        </select>
      </div>
      <div className="flex flex-row flex-wrap h-full">
        {selectedStrategies.map((strategy) => {
          const key = `${selectedCultivation}|${strategy}`;
          const entry = data[key] || {};
          const distObj = entry.distribution;

          if (
            !distObj ||
            typeof distObj !== "object" ||
            Object.keys(distObj).length === 0
          ) {
            return (
              <div
                key={strategy}
                className="flex flex-col flex-1 min-w-[300px] p-4"
              >
                <h3 className="text-center font-semibold mb-2">{strategy}</h3>
                <p className="text-sm text-center">No distribution data available.</p>
              </div>
            );
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
            .sort((a, b) => a.bin - b.bin);

          const barColor = colorMap[strategy] || "#8884d8";

          return (
            <div
              key={strategy}
              className="flex flex-col flex-1 min-w-[300px] border-r last:border-r-0 border-gray-600"
            >
              <h3 className="text-center font-semibold mt-2">{strategy}</h3>
              <div className="p-4 text-sm flex flex-wrap gap-4">
                <span>🎯 Target: {formatWeight(target)}</span>
                <span>⏬ Lower cap: {formatWeight(lowerCap)}</span>
                <span>⏫ Bonus cap: {formatWeight(bonusCap)}</span>
              </div>
              <div className="flex-grow p-4 min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={distribution}
                    margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="bin"
                      label={{ value: "Weight (g)", position: "insideBottom", dy: 10 }}
                    />
                    <YAxis
                      label={{
                        value: mode === "count" ? "Count" : "Revenue",
                        angle: -90,
                        dx: -10,
                      }}
                    />
                    <Tooltip
                      content={({ active, payload, label }) => {
                        if (active && payload && payload.length) {
                          const item = payload[0].payload;
                          return (
                            <div className="bg-gray-800 p-2 text-sm text-white rounded">
                              <p className="font-semibold">{label}g</p>
                              <p>
                                {mode === "count"
                                  ? `Count: ${item.count}`
                                  : `Revenue: ${item.revenue}`}
                              </p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar
                      dataKey={mode}
                      isAnimationActive
                      animationDuration={800}
                      fill={barColor}
                    >
                      <LabelList dataKey={mode} position="top" className="text-xs" />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ProfitDistribution;
