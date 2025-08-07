import React, { useState } from "react";
import {
  BarChart as ReBarChart,
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
  A: "#ff0000",
  B: "#ffa500",
  C: "#008000",
  D: "#0000ff",
};

const ProfitDistribution = ({
  selectedCultivation,
  selectedStrategy,
  data = {},
}) => {
  const [mode, setMode] = useState("count");

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
  const distribution = entry.weight_distribution_data || [];

  if (!Array.isArray(distribution) || distribution.length === 0) {
    return (
      <div className="p-4 text-center">
        <p className="text-sm">No distribution data available.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between border-b border-gray-600 p-4">
        <h2 className="text-lg font-semibold">📊 Profit Distribution by Weight</h2>
        <select
          className="bg-gray-700 text-white text-sm p-1 rounded"
          value={mode}
          onChange={(e) => setMode(e.target.value)}
        >
          <option value="count">Count</option>
          <option value="revenue">Revenue</option>
        </select>
      </div>
      <div className="p-4 text-sm flex flex-wrap gap-4">
        <span>Target: {entry.target_weight}</span>
        <span>Lower penalty threshold: {entry.lower_cap}</span>
        <span>Bonus cap: {entry.upper_cap}</span>
      </div>
      <div className="flex-1 p-4">
        <ResponsiveContainer width="100%" height="100%">
          <ReBarChart data={distribution} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="bin" />
            <YAxis />
            <Tooltip
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  const item = payload[0].payload;
                  return (
                    <div className="bg-gray-800 p-2 text-sm">
                      <p className="font-semibold">{label}</p>
                      <p>Category: {item.category}</p>
                      <p>Revenue: {item.revenue}</p>
                      <p>{mode === "count" ? `Count: ${item.count}` : `Revenue: ${item.revenue}`}</p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Bar dataKey={mode} isAnimationActive animationDuration={800}>
              <LabelList dataKey={mode} position="top" className="text-xs" />
              {distribution.map((d, idx) => (
                <Cell key={`cell-${idx}`} fill={barColors[d.category] || "#8884d8"} />
              ))}
            </Bar>
          </ReBarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default ProfitDistribution;

