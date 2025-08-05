export interface StrategyKPI {
  name: string;
  bonus_penalty: number;
  profit: number;
  energy_cost: number;
  weight_achieved: number;
  /**
   * When provided, the sum of {@link base_revenue_a} and {@link base_revenue_b}
   * will be ignored.
   */
  base_revenue_a?: number;
  base_revenue_b?: number;
  /**
   * Total base revenue. May be provided directly or derived from
   * {@link base_revenue_a} and {@link base_revenue_b}.
   */
  base_revenue?: number;
}

/**
 * Map of cultivation identifiers to the list of KPIs for each strategy
 * within that cultivation.
 */
export type StrategiesByCultivation = Record<string, StrategyKPI[]>;
