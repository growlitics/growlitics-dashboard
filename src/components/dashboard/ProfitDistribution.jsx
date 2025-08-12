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
  Cell,
} from "recharts";

const barColors = {
  A: "#008000",
  B: "#ffa500",
  C: "#ff0000",
  D: "#0000ff",
};

const ProfitDistribution = ({ selectedCultivation, selectedStrategy, data = {} }) => {
  const [mode, setMode] = useState("count");

  // Guard: only show chart if 1 cultivation and 1 strategy are selected
  if (!selectedCultivation || !selectedStrategy) {
    return (
      <div className="p-4 text-center">
        <p className="text-sm">
          👆 Select a single cultivation and strategy to view the profit distribution.
        </p>
      </div>
    );
  }

  const key = `${selectedCultivation}|${selectedStrategy}`;
  const entry = data[key] || {};
  const distObj = entry.distribution;

  if (!distObj || typeof distObj !== "object" || Object.keys(distObj).length === 0) {
    return (
      <div className="p-4 text-center">
        <p className="text-sm">No distribution data available.</p>
      </div>
    );
  }

  // Convert { "65": 100, "70": 200 } → [{ bin: 65, count: 100 }, ...]
  const distribution = Object.entries(distObj)
    .map(([bin, count]) => ({ bin: parseInt(bin, 10), count: Number(count) }))
    .sort((a, b) => a.bin - b.bin);

  return (
    <div className="flex flex-col h-full w-full">
      <div className="flex items-center justify-between border-b border-gray-600 p-4">
        <h2 className="text-lg font-semibold">📊 Profit Distribution by Weight</h2>
        <select
          className="bg-gray-700 text-white text-sm p-1 rounded"
          value={mode}
          onChange={(e) => setMode(e.target.value)}
        >
          <option value="count">Count</option>
          <option value="revenue" disabled>Revenue (todo)</option>
        </select>
      </div>

      <div className="p-4 text-sm flex flex-wrap gap-4">
        <span>🎯 Target: {entry.target_weight ?? "?"}g</span>
        <span>⏬ Lower cap: {entry.lower_cap ?? "?"}g</span>
        <span>⏫ Bonus cap: {entry.upper_cap ?? "?"}g</span>
      </div>

      <div className="flex-grow p-4 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={distribution} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="bin" label={{ value: "Weight (g)", position: "insideBottom", dy: 10 }} />
            <YAxis label={{ value: "Count", angle: -90, dx: -10 }} />
            <Tooltip
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  const item = payload[0].payload;
                  return (
                    <div className="bg-gray-800 p-2 text-sm text-white rounded">
                      <p className="font-semibold">{label}g</p>
                      <p>{mode === "count" ? `Count: ${item.count}` : `Revenue: ${item.revenue}`}</p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Bar dataKey={mode} isAnimationActive animationDuration={800} fill="#8884d8">
              <LabelList dataKey={mode} position="top" className="text-xs" />
              {distribution.map((_, idx) => (
                <Cell key={`cell-${idx}`} fill="#69b3a2" />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default ProfitDistribution;
