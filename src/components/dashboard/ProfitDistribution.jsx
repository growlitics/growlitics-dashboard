import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

const ProfitDistribution = ({ selectedCultivation, selectedStrategy, data = {} }) => {
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
  const distObj = data[key]?.distribution;

  if (!distObj || typeof distObj !== "object" || Object.keys(distObj).length === 0) {
    return (
      <div className="p-4 text-center">
        <p className="text-sm">No distribution data available.</p>
      </div>
    );
  }

  const distribution = Object.entries(distObj)
    .map(([bin, count]) => ({ bin: parseInt(bin, 10), count: Number(count) }))
    .sort((a, b) => a.bin - b.bin);

  return (
    <div className="flex flex-col h-full">
      <div className="border-b border-gray-600 p-4">
        <h2 className="text-lg font-semibold">
          Profit Distribution (by Harvest Weight)
        </h2>
      </div>
      <div className="flex-1 p-4">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={distribution}
            margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="bin" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="count" fill="#8884d8" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default ProfitDistribution;

