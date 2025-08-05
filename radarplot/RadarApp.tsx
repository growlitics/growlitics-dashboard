import { useEffect, useMemo, useState } from 'react';
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
} from 'recharts';
import type { ActiveDotProps } from 'recharts/types/util/types';
import type { TickItemTextProps } from 'recharts/types/polar/PolarAngleAxis';

import type { StrategyKPI, StrategiesByCultivation } from './types';
import { DEFAULT_STRATEGIES } from './defaultStrategies';

// Ordered colors by profit rank: gold (optimized/highest), green, red, blue, etc.
const COLOR_PALETTE = [
  '#FFD700', // Highest profit / optimized
  '#2ca02c', // Second highest profit
  '#d62728', // Third highest profit
  '#1f77b4', // Fourth highest profit
  '#ff7f0e',
  '#9467bd',
  '#8c564b',
  '#e377c2',
  '#7f7f7f',
  '#17becf',
];

const round1 = (n: number) => Math.round(n * 10) / 10;

function renderActiveDot(color: string, name: string) {
  return (props: ActiveDotProps & { payload: Record<string, number> }) => {
    const { cx, cy, payload } = props;
    const raw = round1(payload[`${name}-raw`]);
    return (
      <g>
        <circle cx={cx} cy={cy} r={4} stroke={color} strokeWidth={2} fill="#fff" />
        <text
          x={cx}
          y={Number(cy) - 8}
          textAnchor="middle"
          fill={color}
          fontSize={12}
          fontWeight="bold"
        >
          {raw}
        </text>
      </g>
    );
  };
}

type NumericKPIKey =
  | 'bonus_penalty'
  | 'profit'
  | 'energy_cost'
  | 'weight_achieved'
  | 'base_revenue';

const KPI_FIELDS: { key: NumericKPIKey; label: string }[] = [
  { key: 'bonus_penalty', label: 'Bonus/Penalty' },
  { key: 'profit', label: 'Profit' },
  { key: 'energy_cost', label: 'Energy Cost' },
  { key: 'weight_achieved', label: 'Weight' },
  { key: 'base_revenue', label: 'Base Revenue' },
];

const KPI_RANGES: Record<NumericKPIKey, [number, number]> = {
  profit: [0, 50],
  energy_cost: [0, 8],
  weight_achieved: [20, 100],
  bonus_penalty: [-3, 5],
  base_revenue: [0, 35],
};
interface AngleTickProps extends TickItemTextProps {
  x?: number | string;
  y?: number | string;
  cx?: number | string;
  cy?: number | string;
}

const renderAngleTick = (props: AngleTickProps) => {
  const { payload, x = 0, y = 0, cx = 0, cy = 0 } = props;
  const xNum = Number(x);
  const yNum = Number(y);
  const cxNum = Number(cx);
  const cyNum = Number(cy);
  const angle = Math.atan2(yNum - cyNum, xNum - cxNum);
  const isLeft = Math.cos(angle) < 0;
  const isTop = Math.sin(angle) < 0;
  const dx = isLeft ? -10 : 10;
  const dy = isTop ? -5 : 15;
  return (
    <text
      x={xNum + dx}
      y={yNum + dy}
      textAnchor={isLeft ? 'end' : 'start'}
      fill="currentColor"
      fontSize={12}
    >
      {payload.value}
    </text>
  );
};

function groupStrategiesArray(parsed: unknown[]): StrategiesByCultivation {
  const possibleKeys = [
    'cultivation',
    'cultivation_name',
    'cultivationName',
    'batch',
    'batch_name',
    'batchName',
  ];
  for (const key of possibleKeys) {
    if (
      parsed.some((item) => {
        const obj = item as Record<string, unknown>;
        return obj && typeof obj[key] === 'string';
      })
    ) {
      const grouped: StrategiesByCultivation = {};
      parsed.forEach((item) => {
        const obj = item as Record<string, unknown>;
        const cultivation =
          typeof obj[key] === 'string' ? (obj[key] as string) : 'All Cultivations';
        const rest = { ...obj };
        delete rest[key];
        (grouped[cultivation] ||= []).push(rest as unknown as StrategyKPI);
      });
      return grouped;
    }
  }
  return { 'All Cultivations': parsed as StrategyKPI[] };
}

async function loadStrategies(): Promise<StrategiesByCultivation> {
  const params = new URLSearchParams(window.location.search);
  const raw = params.get('strategies');
  if (raw) {
    const decoders = [
      (s: string) => decodeURIComponent(s),
      (s: string) => atob(s),
    ];
    for (const decode of decoders) {
      try {
        const parsed = JSON.parse(decode(raw));
        if (Array.isArray(parsed)) {
          return groupStrategiesArray(parsed);
        }
        if (parsed && typeof parsed === 'object') {
          return parsed as StrategiesByCultivation;
        }
      } catch {
        // try next decoding strategy
      }
    }
    console.error('Failed to parse strategies parameter');
  }

  const dataUrl =
    params.get('dataUrl') || params.get('data_url') || import.meta.env.VITE_DATA_URL;
  if (dataUrl) {
    try {
      const url = new URL(dataUrl, window.location.href).toString();
      const res = await fetch(url);
      if (!res.ok) throw new Error(`Failed to fetch strategies: ${res.status}`);
      const parsed = await res.json();
      if (Array.isArray(parsed)) {
        return groupStrategiesArray(parsed);
      }
      return parsed as StrategiesByCultivation;
    } catch (err) {
      console.error('Failed to fetch strategies', err);
    }
  }

  return DEFAULT_STRATEGIES;
}

function RadarApp() {
  const [data, setData] = useState<StrategiesByCultivation | null>(null);
  const [selectedCultivations, setSelectedCultivations] = useState<string[]>([]);
  const [strategies, setStrategies] = useState<StrategyKPI[]>([]);
  const [visible, setVisible] = useState<Record<string, boolean>>({});

  const colorMap = useMemo<Record<string, string>>(() => {
    if (strategies.length === 0) return {};
    // Assign colors based on profit ranking (highest first)
    const sorted = [...strategies].sort(
      (a, b) => (Number(b.profit) || 0) - (Number(a.profit) || 0),
    );
    const map: Record<string, string> = {};
    sorted.forEach((s, idx) => {
      map[s.name] = COLOR_PALETTE[idx % COLOR_PALETTE.length];
    });
    return map;
  }, [strategies]);

  useEffect(() => {
    loadStrategies().then((d) => {
      setData(d);
      const cultivations = Object.keys(d);
      setSelectedCultivations(cultivations);
    });
  }, []);

  useEffect(() => {
    if (!data || selectedCultivations.length === 0) {
      setStrategies([]);
      return;
    }
    const strategyNames = new Set<string>();
    selectedCultivations.forEach((c) => {
      data[c].forEach((s) => strategyNames.add(s.name));
    });
    const averaged: StrategyKPI[] = Array.from(strategyNames).map((name) => {
      let count = 0;
      let bonus_penalty = 0;
      let profit = 0;
      let energy_cost = 0;
      let weight_achieved = 0;
      let base_revenue_a = 0;
      let base_revenue_b = 0;
      let base_revenue = 0;
      selectedCultivations.forEach((c) => {
        const st = data[c].find((s) => s.name === name);
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
  }, [data, selectedCultivations]);

  useEffect(() => {
    setVisible((prev) => {
      const vis: Record<string, boolean> = {};
      strategies.forEach((st) => {
        vis[st.name] = prev[st.name] ?? true;
      });
      return vis;
    });
  }, [strategies]);

  const toggleCultivation = (name: string) => {
    setSelectedCultivations((prev) =>
      prev.includes(name) ? prev.filter((c) => c !== name) : [...prev, name],
    );
  };

  const chartData = useMemo(() => {
    return KPI_FIELDS.map((kpi) => {
      const [domainMin, domainMax] = KPI_RANGES[kpi.key];
      const entry: Record<string, number | string> = { metric: kpi.label };
      strategies.forEach((s) => {
        const v = Number(s[kpi.key]) || 0;
        const scaled = (v - domainMin) / (domainMax - domainMin);
        entry[s.name] = scaled;
        entry[`${s.name}-raw`] = round1(v);
      });
      return entry;
    });
  }, [strategies]);
  if (data === null) {
    return (
      <div className="min-h-screen bg-gray-100 text-gray-900 dark:bg-gray-900 dark:text-gray-100 flex items-center justify-center">
        <div className="bg-white dark:bg-gray-800 p-10 rounded-2xl shadow-xl">
          <h1 className="text-3xl font-bold text-center text-blue-600 dark:text-blue-400">
            🌱 Growlitics Dashboard
          </h1>
          <p className="mt-4 text-gray-600 dark:text-gray-300 text-center">Loading...</p>
        </div>
      </div>
    );
  }

  const toggle = (name: string) =>
    setVisible((v) => ({ ...v, [name]: !v[name] }));

  return (
    <div className="min-h-screen bg-gray-100 text-gray-900 dark:bg-gray-900 dark:text-gray-100 flex items-center justify-center">
      <div className="bg-white dark:bg-gray-800 p-10 rounded-2xl shadow-xl">
        <h1 className="text-3xl font-bold text-center text-blue-600 dark:text-blue-400">
          🌱 Growlitics Radar
        </h1>
        {data && (
          <div className="mt-4 flex justify-center gap-2 flex-wrap">
            {Object.keys(data).map((c) => {
              const isSelected = selectedCultivations.includes(c);
              return (
                <button
                  key={c}
                  type="button"
                  onClick={() => toggleCultivation(c)}
                  className={`px-3 py-1 rounded-full text-sm font-semibold border ${
                    isSelected
                      ? 'bg-blue-500 text-white border-blue-500'
                      : 'text-blue-500 border-blue-500'
                  }`}
                >
                  {c}
                </button>
              );
            })}
          </div>
        )}
        <div className="mt-6 flex justify-center gap-2 flex-wrap">
          {strategies.map((s) => {
            const color = colorMap[s.name];
            const isOn = visible[s.name];
            return (
              <button
                key={s.name}
                type="button"
                onClick={() => toggle(s.name)}
                className="px-3 py-1 rounded-full text-sm font-semibold border"
                style={{
                  borderColor: color,
                  backgroundColor: isOn ? color : 'transparent',
                  color: isOn ? '#000' : color,
                }}
              >
                {s.name}
              </button>
            );
          })}
        </div>
        <div className="mt-8 flex justify-center">
          <RadarChart
            cx="50%"
            cy="50%"
            outerRadius="80%"
            width={500}
            height={400}
            data={chartData}
            margin={{ top: 40, right: 40, bottom: 40, left: 40 }}
          >
            <PolarGrid stroke="currentColor" strokeOpacity={0.2} />
            <PolarAngleAxis dataKey="metric" tick={renderAngleTick} tickLine={false} />
            <PolarRadiusAxis tick={false} axisLine={false} tickLine={false} domain={[0, 1]} />
            {strategies
              .filter((s) => visible[s.name])
              .map((s) => {
                const color = colorMap[s.name];
                return (
                  <Radar
                    key={s.name}
                    name={s.name}
                    dataKey={s.name}
                    stroke={color}
                    fill={color}
                    fillOpacity={0.4}
                    dot={{ r: 3, stroke: color, fill: color }}
                    activeDot={renderActiveDot(color, s.name)}
                  />
                );
              })}
          </RadarChart>
        </div>
      </div>
    </div>
  );
}

export default RadarApp;

