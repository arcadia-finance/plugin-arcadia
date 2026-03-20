export interface AccountSummary {
  account_address: string;
  creation_version: number;
  numeraire: string;
}

export interface AccountOverview {
  owner: string;
  creditor: string;
  health_factor: number;
  collateral_value: string;
  debt_value: string;
  assets: Array<{ address: string; symbol: string; amount: string; id: number }>;
}

export interface Pool {
  name: string;
  address: string;
  apy: number;
  utilisation: number;
  total_realised_liquidity_usd: number;
}

export interface FeaturedStrategy {
  id: number;
  display_name: string;
  protocol: string;
  apy: number;
  numeraire: string;
  leverage: number;
  is_spot: boolean;
}

export interface StrategyInfo {
  pool_address: string;
  sqrt_ratio_x96: string;
  current_tick: number;
  current_tick_float: number;
  ranges: Record<string, unknown>;
}

export interface Strategy {
  strategy_id: number;
  asset_address: string;
  asset_decimals: number;
}

export interface Asset {
  name: string;
  address: string;
  decimals: number;
  standard: string;
}

export interface BundleResponse {
  calldata: string;
  fx_call_to: string;
  chain_id: number;
  tenderly_sim_status: string;
}

export interface HistoricResponse {
  values: Record<string, number>;
  value_now: { timestamp: number; usd_value: number };
}

export interface LeaderboardEntry {
  user_address: string;
  total_points: number;
  amount_referred: number;
  points_referred: number;
}

export interface PointsData {
  points: number;
  wallet_address: string;
}
