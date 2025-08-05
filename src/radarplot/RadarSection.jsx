import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { DEFAULT_STRATEGIES } from "./defaultStrategies";

const RadarContext = createContext(null);

const round1 = (n) => Math.round(n * 10) / 10;

// Set up default visibility so that all strategies are shown initially
const INITIAL_VISIBLE = Object.values(DEFAULT_STRATEGIES).reduce(
  (acc, stratList) => {
    stratList.forEach((s) => {
      acc[s.name] = true;
    });
    return acc;
  },
  {}
);

export const RadarProvider = ({ children }) => {
  const [selectedCultivations, setSelectedCultivations] = useState(
    Object.keys(DEFAULT_STRATEGIES)
  );
  const [strategies, setStrategies] = useState([]);
  const [visible, setVisible] = useState(INITIAL_VISIBLE);

  useEffect(() => {
    const strategyNames = new Set();
    selectedCultivations.forEach((c) => {
      DEFAULT_STRATEGIES[c].forEach((s) => strategyNames.add(s.name));
    });
    const averaged = Array.from(strategyNames).map((name) => {
      let count = 0;
      let bonus_penalty = 0;
      let profit = 0;
      let energy_cost = 0;
      let weight_achieved = 0;
      let base_revenue_a = 0;
      let base_revenue_b = 0;
      let base_revenue = 0;
      selectedCultivations.forEach((c) => {
        const st = DEFAULT_STRATEGIES[c].find((s) => s.name === name);
        if (st) {
          bonus_penalty += Number(st.bonus_penalty) || 0;
          profit += Number(st.profit) || 0;
          energy_cost += Number(st.energy_cost) || 0;
          weight_achieved += Number(st.weight_achieved) || 0;
          base_revenue_a += Number(st.base_revenue_a) || 0;
          base_revenue_b += Number(st.base_revenue_b) || 0;
          base_revenue +=
            st.base_revenue !== undefined
              ? Number(st.base_revenue) || 0
              : (Number(st.base_revenue_a) || 0) +
                (Number(st.base_revenue_b) || 0);
          count += 1;
        }
      });
      const denom = count || 1;
      return {
        name,
        bonus_penalty: round1(bonus_penalty / denom),
        profit: round1(profit / denom),
        energy_cost: round1(energy_cost / denom),
        weight_achieved: round1(weight_achieved / denom),
        base_revenue_a: round1(base_revenue_a / denom),
        base_revenue_b: round1(base_revenue_b / denom),
        base_revenue: round1(base_revenue / denom),
      };
    });
    setStrategies(averaged);
  }, [selectedCultivations]);


  const colorMap = useMemo(() => {
    const palette = [
      "#FFD700",
      "#2ca02c",
      "#d62728",
      "#1f77b4",
      "#ff7f0e",
      "#9467bd",
      "#8c564b",
      "#e377c2",
      "#7f7f7f",
      "#17becf",
    ];
    const sorted = [...strategies].sort(
      (a, b) => (Number(b.profit) || 0) - (Number(a.profit) || 0)
    );
    const map = {};
    sorted.forEach((s, idx) => {
      map[s.name] = palette[idx % palette.length];
    });
    return map;
  }, [strategies]);

  const KPI_FIELDS = [
    { key: "bonus_penalty", label: "Bonus/Penalty" },
    { key: "profit", label: "Profit" },
    { key: "energy_cost", label: "Energy Cost" },
    { key: "weight_achieved", label: "Weight" },
    { key: "base_revenue", label: "Base Revenue" },
  ];

  const KPI_RANGES = {
    profit: [0, 50],
    energy_cost: [0, 8],
    weight_achieved: [20, 100],
    bonus_penalty: [-3, 5],
    base_revenue: [0, 35],
  };

  const chartData = useMemo(() => {
    return KPI_FIELDS.map((kpi) => {
      const [domainMin, domainMax] = KPI_RANGES[kpi.key];
      const entry = { metric: kpi.label };
      strategies.forEach((s) => {
        const v = Number(s[kpi.key]) || 0;
        const scaled = (v - domainMin) / (domainMax - domainMin);
        entry[s.name] = scaled;
        entry[`${s.name}-raw`] = round1(v);
      });
      return entry;
    });
  }, [strategies]);

  const toggleCultivation = (name) => {
    setSelectedCultivations((prev) =>
      prev.includes(name) ? prev.filter((c) => c !== name) : [...prev, name]
    );
  };

  const toggleStrategy = (name) => {
    setVisible((v) => ({ ...v, [name]: !v[name] }));
  };

  return (
    <RadarContext.Provider
      value={{
        selectedCultivations,
        strategies,
        visible,
        colorMap,
        chartData,
        toggleCultivation,
        toggleStrategy,
      }}
    >
      {children}
    </RadarContext.Provider>
  );
};

export const useRadar = () => useContext(RadarContext);

const RadarControls = () => {
  const {
    selectedCultivations,
    strategies,
    visible,
    colorMap,
    toggleCultivation,
    toggleStrategy,
  } = useRadar();

  return (
    <div className="flex flex-wrap gap-2 items-center">
      {Object.keys(DEFAULT_STRATEGIES).map((c) => {
        const isSelected = selectedCultivations.includes(c);
        return (
          <button
            key={c}
            type="button"
            onClick={() => toggleCultivation(c)}
            className={`px-3 py-1 rounded-full text-sm font-semibold border ${
              isSelected
                ? "bg-blue-500 text-white border-blue-500"
                : "text-blue-500 border-blue-500"
            }`}
          >
            {c}
          </button>
        );
      })}
      {strategies.map((s) => {
        const color = colorMap[s.name];
        const isOn = visible[s.name] !== false;
        return (
          <button
            key={s.name}
            type="button"
            onClick={() => toggleStrategy(s.name)}
            className="px-3 py-1 rounded-full text-sm font-semibold border"
            style={{
              borderColor: color,
              backgroundColor: isOn ? color : "transparent",
              color: isOn ? "#000" : color,
            }}
          >
            {s.name}
          </button>
        );
      })}
    </div>
  );
};

export default RadarControls;
