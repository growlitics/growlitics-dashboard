import type { StrategiesByCultivation } from './types';

export const DEFAULT_STRATEGIES: StrategiesByCultivation = {
  '2024-5, Vak 11, Serenity': [
    {
      name: 'Default',
      bonus_penalty: -1,
      profit: 12,
      energy_cost: 3,
      weight_achieved: 60,
      base_revenue_a: 8,
      base_revenue_b: 8,
    },
    {
      name: 'Optimized',
      bonus_penalty: 2,
      profit: 19,
      energy_cost: 3.5,
      weight_achieved: 72,
      base_revenue_a: 10,
      base_revenue_b: 10.5,
    },
  ],
  '2024-5, Vak 12, Baltica': [
    {
      name: 'Default',
      bonus_penalty: 0,
      profit: 14,
      energy_cost: 4,
      weight_achieved: 66,
      base_revenue_a: 9,
      base_revenue_b: 9,
    },
    {
      name: 'Optimized',
      bonus_penalty: 4,
      profit: 22,
      energy_cost: 5,
      weight_achieved: 80,
      base_revenue_a: 12,
      base_revenue_b: 11,
    },
  ],
};
