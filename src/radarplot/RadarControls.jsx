import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { DEFAULT_STRATEGIES } from "./defaultStrategies";

const COLOR_PALETTE = [
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

const COLOR_BUTTON_CLASSES = [
  {
    border: "border-yellow-500",
    text: "text-yellow-500",
    hover: "hover:bg-yellow-500 hover:text-black",
    selected: "bg-yellow-500 text-black",
  },
  {
    border: "border-green-500",
    text: "text-green-500",
    hover: "hover:bg-green-500 hover:text-black",
    selected: "bg-green-500 text-black",
  },
  {
    border: "border-red-500",
    text: "text-red-500",
    hover: "hover:bg-red-500 hover:text-white",
    selected: "bg-red-500 text-white",
  },
  {
    border: "border-blue-500",
    text: "text-blue-500",
    hover: "hover:bg-blue-500 hover:text-white",
    selected: "bg-blue-500 text-white",
  },
  {
    border: "border-orange-500",
    text: "text-orange-500",
    hover: "hover:bg-orange-500 hover:text-black",
    selected: "bg-orange-500 text-black",
  },
  {
    border: "border-purple-500",
    text: "text-purple-500",
    hover: "hover:bg-purple-500 hover:text-white",
    selected: "bg-purple-500 text-white",
  },
  {
    border: "border-pink-500",
    text: "text-pink-500",
    hover: "hover:bg-pink-500 hover:text-white",
    selected: "bg-pink-500 text-white",
  },
  {
    border: "border-gray-500",
    text: "text-gray-500",
    hover: "hover:bg-gray-500 hover:text-white",
    selected: "bg-gray-500 text-white",
  },
  {
    border: "border-teal-500",
    text: "text-teal-500",
    hover: "hover:bg-teal-500 hover:text-black",
    selected: "bg-teal-500 text-black",
  },
  {
    border: "border-cyan-500",
    text: "text-cyan-500",
    hover: "hover:bg-cyan-500 hover:text-black",
    selected: "bg-cyan-500 text-black",
  },
];

const BUTTON_BASE_CLASS =
  "rounded-full px-3 py-1 text-sm font-medium border transition-colors";

const RadarContext = createContext();

export const useRadar = () => useContext(RadarContext);

export const RadarProvider = ({ data, children }) => {
  const baseData = data && Object.keys(data).length ? data : DEFAULT_STRATEGIES;
  const cultivationKeys = Object.keys(baseData);
  const defaultCultivations = cultivationKeys.slice(0, 2);
  const [selectedCultivations, setSelectedCultivations] = useState(defaultCultivations);
  const [strategies, setStrategies] = useState([]);
  const [visible, setVisible] = useState({});

  useEffect(() => {
    const strategyNames = new Set();
    selectedCultivations.forEach((c) => {
      (baseData[c] || []).forEach((s) => strategyNames.add(s.name));
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
        const st = (baseData[c] || []).find((s) => s.name === name);
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
              : (Number(st.base_revenue_a) || 0) + (Number(st.base_revenue_b) || 0);
          count += 1;
        }
      });
      const denom = count || 1;
      return {
        name,
        bonus_penalty: Math.round((bonus_penalty / denom) * 10) / 10,
        profit: Math.round((profit / denom) * 10) / 10,
        energy_cost: Math.round((energy_cost / denom) * 10) / 10,
        weight_achieved: Math.round((weight_achieved / denom) * 10) / 10,
        base_revenue_a: Math.round((base_revenue_a / denom) * 10) / 10,
        base_revenue_b: Math.round((base_revenue_b / denom) * 10) / 10,
        base_revenue: Math.round((base_revenue / denom) * 10) / 10,
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

  const colorMap = useMemo(() => {
    const sorted = [...strategies].sort(
      (a, b) => (Number(b.profit) || 0) - (Number(a.profit) || 0)
    );
    const map = {};
    sorted.forEach((s, idx) => {
      map[s.name] = COLOR_PALETTE[idx % COLOR_PALETTE.length];
    });
    return map;
  }, [strategies]);

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
    allCultivations: cultivationKeys,
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
    <div className="flex flex-wrap justify-end gap-2">
      {allCultivations.map((c) => {
        const isSelected = selectedCultivations.includes(c);
        return (
          <button
            key={c}
            type="button"
            onClick={() => toggleCultivation(c)}
            className={`${BUTTON_BASE_CLASS} border-blue-500 ${
              isSelected
                ? "bg-blue-500 text-white"
                : "text-blue-500 hover:bg-blue-500 hover:text-white"
            }`}
          >
            {c}
          </button>
        );
      })}
      {strategies.map((s) => {
        const color = colorMap[s.name];
        const colorIdx = COLOR_PALETTE.indexOf(color);
        const cls = COLOR_BUTTON_CLASSES[colorIdx % COLOR_BUTTON_CLASSES.length];
        const isOn = visible[s.name];
        return (
          <button
            key={s.name}
            type="button"
            onClick={() => toggleStrategy(s.name)}
            className={`${BUTTON_BASE_CLASS} ${cls.border} ${
              isOn ? cls.selected : `${cls.text} ${cls.hover}`
            }`}
          >
            {s.name}
          </button>
        );
      })}
    </div>
  );
};

export default RadarControls;

