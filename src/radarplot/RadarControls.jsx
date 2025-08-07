import { createContext, useContext, useEffect, useMemo, useState } from "react";

export const COLOR_PALETTE = [
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

export const generateColorMap = (names = []) => {
  const filtered = names.filter(Boolean);
  const optimized = filtered.find((n) =>
    n.toLowerCase().includes("optimized")
  );
  const palette = COLOR_PALETTE.slice(1);
  const map = {};
  filtered
    .filter((n) => n !== optimized)
    .sort((a, b) => a.localeCompare(b))
    .forEach((name, idx) => {
      map[name] = palette[idx % palette.length];
    });
  if (optimized) {
    map[optimized] = COLOR_PALETTE[0];
  }
  return map;
};

const RadarContext = createContext();

export const useRadar = () => useContext(RadarContext);

const buildData = (raw = {}) => {
  const cultivations = Object.keys(raw || {});
  const strategiesSet = new Set();
  const kpis = {};
  cultivations.forEach((c) => {
    (raw[c] || []).forEach((s) => {
      strategiesSet.add(s.name);
      kpis[`${c}|${s.name}`] = s;
    });
  });
  return {
    cultivations,
    strategies: Array.from(strategiesSet),
    kpis,
  };
};

export const RadarProvider = ({ data = {}, batches = [], children }) => {
  const baseData = useMemo(() => {
    if (data) {
      if (data.cultivations) return data;
      if (Object.keys(data).length) return buildData(data);
    }
    return buildData();
  }, [data]);

  const allCultivations = baseData.cultivations || [];
  const defaultCultivations = allCultivations.slice(0, 2);
  const [selectedCultivations, setSelectedCultivations] = useState(defaultCultivations);
  const [strategies, setStrategies] = useState([]);
  const [visible, setVisible] = useState({});

  // Reset selections when incoming data changes
  useEffect(() => {
    const defaults = (baseData.cultivations || []).slice(0, 2);
    setSelectedCultivations(defaults);
    setVisible({});
  }, [baseData]);

  useEffect(() => {
    const strategyNames = new Set();
    selectedCultivations.forEach((c) => {
      (baseData.strategies || []).forEach((s) => {
        if (baseData.kpis && baseData.kpis[`${c}|${s}`]) strategyNames.add(s);
      });
    });
    const averaged = Array.from(strategyNames).map((name) => {
      let count = 0;
      let bonus_penalty = 0;
      let profit_per_m2 = 0;
      let energy_cost = 0;
      let weight_achieved = 0;
      let base_revenue_a = 0;
      let base_revenue_b = 0;
      let base_revenue = 0;
      selectedCultivations.forEach((c) => {
        const st = baseData.kpis ? baseData.kpis[`${c}|${name}`] : undefined;
        if (st) {
          bonus_penalty += Number(st.bonus_penalty) || 0;
          const profitVal = st.profit_per_m2 ?? st.profit;
          profit_per_m2 += Number(profitVal) || 0;
          energy_cost += Number(st.energy_cost) || 0;
          const weightVal =
            st.weight_achieved ??
            st.weight ??
            st.total_weight ??
            st.harvest_weight_g;
          const numericWeight = parseFloat(weightVal);
          if (!Number.isNaN(numericWeight)) {
            weight_achieved += numericWeight;
          }
          base_revenue_a += Number(st.base_revenue_a) || 0;
          base_revenue_b += Number(st.base_revenue_b) || 0;
          base_revenue +=
            st.base_revenue !== undefined
              ? Number(st.base_revenue) || 0
              : (Number(st.base_revenue_a) || 0) + (Number(st.base_revenue_b) || 0);
          count += 1;
        }
      });
      const denom = count || 1;
      return {
        name,
        bonus_penalty: Math.round((bonus_penalty / denom) * 1000) / 1000,
        profit_per_m2: Math.round((profit_per_m2 / denom) * 1000) / 1000,
        energy_cost: Math.round((energy_cost / denom) * 1000) / 1000,
        weight_achieved: Math.round((weight_achieved / denom) * 1000) / 1000,
        base_revenue_a: Math.round((base_revenue_a / denom) * 1000) / 1000,
        base_revenue_b: Math.round((base_revenue_b / denom) * 1000) / 1000,
        base_revenue: Math.round((base_revenue / denom) * 1000) / 1000,
      };
    });
    setStrategies(averaged);
  }, [selectedCultivations, baseData]);

  useEffect(() => {
    setVisible((prev) => {
      const vis = { ...prev };
      strategies.forEach((st) => {
        if (vis[st.name] === undefined) vis[st.name] = true;
      });
      return vis;
    });
  }, [strategies]);

  const colorMap = useMemo(
    () => generateColorMap(baseData.strategies),
    [baseData]
  );

  const toggleCultivation = (name) => {
    setSelectedCultivations((prev) =>
      prev.includes(name) ? prev.filter((c) => c !== name) : [...prev, name]
    );
  };

  const toggleStrategy = (name) => {
    setVisible((v) => ({ ...v, [name]: !v[name] }));
  };

  const value = {
    strategies,
    visible,
    colorMap,
    selectedCultivations,
    toggleStrategy,
    toggleCultivation,
    allCultivations,
    batches,
    kpis: baseData.kpis,
  };

  return <RadarContext.Provider value={value}>{children}</RadarContext.Provider>;
};

const RadarControls = () => {
  const {
    allCultivations,
    selectedCultivations,
    strategies,
    visible,
    colorMap,
    toggleStrategy,
    toggleCultivation,
  } = useRadar();

  return (
    <div className="flex flex-wrap items-center justify-start gap-8 mt-4">
      {/* Cultivation buttons */}
      <div className="flex flex-wrap gap-3">
        {allCultivations.map((c) => {
          const isSelected = selectedCultivations.includes(c);
          return (
            <button
              key={c}
              onClick={() => toggleCultivation(c)}
              className={`px-4 py-1.5 rounded-full text-sm font-semibold border transition duration-150 ease-in-out
                ${isSelected
                  ? "bg-white text-black border-gray-300"
                  : "bg-transparent text-white border-white hover:bg-white hover:text-black"
                }`}
            >
              {c}
            </button>
          );
        })}
      </div>

      {/* Strategy buttons */}
      <div className="flex flex-wrap gap-3">
        {strategies.map((s) => {
          const isVisible = visible[s.name];
          const color = colorMap[s.name] || "#999";

          return (
            <button
              key={s.name}
              onClick={() => toggleStrategy(s.name)}
              className="px-4 py-1.5 rounded-full text-sm font-semibold border transition duration-150 ease-in-out"
              style={{
                borderColor: color,
                backgroundColor: isVisible ? color : "transparent",
                color: isVisible ? "#000" : color,
              }}
            >
              {s.name}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default RadarControls;
