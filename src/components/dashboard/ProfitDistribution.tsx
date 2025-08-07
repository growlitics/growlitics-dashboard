import React, { useState } from "react";
import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  LabelList,
  Cell,
} from "recharts";

interface WeightBin {
  bin: string;
  count: number;
  category: string;
  revenue: number;
}

interface WeightDistributionData {
  cultivation_id: string;
  name: string;
  target_weight: number;
  upper_cap: number;
  lower_cap: number;
  weight_bin_distribution: WeightBin[];
}

interface ProfitDistributionProps {
  selectedCultivation?: string | null;
  selectedStrategy?: string | null;
  data: any[];
}

const CATEGORY_COLORS: Record<string, string> = {
  A: "#f44336", // red
  B: "#ff9800", // orange
  C: "#4caf50", // green
  D: "#2196f3", // blue
};

const ProfitDistribution: React.FC<ProfitDistributionProps> = ({
  selectedCultivation,
  selectedStrategy,
  data,
}) => {
  const [metric, setMetric] = useState<"count" | "revenue">("count");

  if (!selectedCultivation || !selectedStrategy) {
    return (
      <div className="p-4 text-center text-sm">
        👆 Select a single cultivation and strategy to view the profit distribution.
      </div>
    );
  }

  const selectedEntry = data.find(
    (d) =>
      d.cultivation_id === selectedCultivation &&
      (d.strategy_name === selectedStrategy || d.strategy === selectedStrategy)
  );

  const dist: WeightDistributionData | undefined =
    selectedEntry?.weight_distribution_data || selectedEntry;

  if (!dist || !dist.weight_bin_distribution) {
    return (
      <div className="p-4 text-center text-sm">
        No distribution data available.
      </div>
    );
  }

  const bins = dist.weight_bin_distribution;

  return (
    <div className="w-full h-full flex flex-col">
      <div className="p-4 border-b border-gray-700 flex justify-between items-center">
        <div>
          <h2 className="text-lg font-semibold">
            📊 Profit Distribution by Weight
          </h2>
          <div className="text-xs mt-1 text-gray-400">
            Target: {dist.target_weight}g · Lower penalty: {dist.lower_cap}g · Bonus cap: {dist.upper_cap}g
          </div>
        </div>
        <select
          className="bg-transparent border border-gray-500 text-sm p-1 rounded"
          value={metric}
          onChange={(e) => setMetric(e.target.value as "count" | "revenue")}
        >
          <option value="count">Count</option>
          <option value="revenue">Revenue</option>
        </select>
      </div>
      <div className="flex-1 p-4">
        <ResponsiveContainer width="100%" height="100%">
          <RechartsBarChart data={bins}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="bin" />
            <YAxis />
            <Tooltip
              formatter={(value: any, name: any) => {
                if (name === "revenue") return [`€${value}`, "Revenue"];
                return [value, name];
              }}
            />
            <Bar dataKey={metric} isAnimationActive>
              <LabelList dataKey={metric} position="top" className="fill-current text-xs" />
              {bins.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={CATEGORY_COLORS[entry.category] || "#8884d8"}
                />
              ))}
            </Bar>
          </RechartsBarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default ProfitDistribution;
