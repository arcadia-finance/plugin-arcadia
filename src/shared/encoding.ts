import { encodeAbiParameters } from "viem";

export const REBALANCER_INITIATOR =
  "0x163CcA8F161CBBB401a96aDf4Cbf4D74f3faD1Ed" as const;
export const COMPOUNDER_INITIATOR =
  "0xb0f46DB8B96e265C1D93396444Eee952086C6f3D" as const;
export const CLAIMER_INITIATOR =
  "0xDc9B596ce15F859673D1Be72e2Aadd41DD3aC4fE" as const;
export const MERKL_INITIATOR =
  "0x521541D932B15631e8a1B037f17457C801722bA0" as const;
export const COWSWAPPER_INITIATOR =
  "0x163CcA8F161CBBB401a96aDf4Cbf4D74f3faD1Ed" as const;

export const DEFAULT_MAX_CLAIM_FEE = BigInt("100000000000000000"); // 10%
export const DEFAULT_MAX_SWAP_FEE = BigInt("500000000000000"); // 0.05%
export const DEFAULT_MAX_TOLERANCE = BigInt("5000000000000000"); // 0.5%
export const DEFAULT_MIN_LIQUIDITY_RATIO = BigInt("990000000000000000"); // 99%

export const MINIMAL_STRATEGY_HOOK =
  "0x13beD1A58d87c0454872656c5328103aAe5eB86A" as const;

export function encodeOuterMetadata(
  strategy: string,
  innerData: `0x${string}`,
): `0x${string}` {
  return encodeAbiParameters(
    [
      { name: "version", type: "uint8" },
      { name: "strategy", type: "string" },
      { name: "data", type: "bytes" },
    ],
    [1, strategy, innerData],
  );
}

export function encodeRebalancerCallbackData(
  initiator: `0x${string}`,
  strategyHook: `0x${string}`,
  metaData: `0x${string}`,
): `0x${string}` {
  const emptyStrategyData = encodeAbiParameters(
    [{ type: "bytes" }],
    ["0x"],
  );

  return encodeAbiParameters(
    [
      { name: "initiator", type: "address" },
      { name: "maxClaimFee", type: "uint256" },
      { name: "maxSwapFee", type: "uint256" },
      { name: "maxTolerance", type: "uint256" },
      { name: "minLiquidityRatio", type: "uint256" },
      { name: "strategyHook", type: "address" },
      { name: "strategyData", type: "bytes" },
      { name: "metaData_", type: "bytes" },
    ],
    [
      initiator,
      DEFAULT_MAX_CLAIM_FEE,
      DEFAULT_MAX_SWAP_FEE,
      DEFAULT_MAX_TOLERANCE,
      DEFAULT_MIN_LIQUIDITY_RATIO,
      strategyHook,
      emptyStrategyData,
      metaData,
    ],
  );
}

export function encodeRebalancerMetadata(params: {
  compoundLeftovers: string;
  optimalToken0Ratio: number;
  triggerLowerRatio: number;
  triggerUpperRatio: number;
  minRebalanceTime: number;
  maxRebalanceTime: number;
}): `0x${string}` {
  const strategyParams = encodeAbiParameters(
    [
      { name: "compound_leftovers", type: "string" },
      { name: "optimal_token0_ratio", type: "uint32" },
      { name: "trigger_tick_lower_ratio", type: "int32" },
      { name: "trigger_tick_upper_ratio", type: "int32" },
      { name: "min_rebalance_time", type: "uint64" },
      { name: "max_rebalance_time", type: "uint64" },
    ],
    [
      params.compoundLeftovers,
      params.optimalToken0Ratio,
      params.triggerLowerRatio,
      params.triggerUpperRatio,
      BigInt(params.minRebalanceTime),
      BigInt(params.maxRebalanceTime),
    ],
  );

  return encodeOuterMetadata("default", strategyParams);
}

export function encodeCompounderCallbackData(
  initiator: `0x${string}`,
): `0x${string}` {
  return encodeAbiParameters(
    [
      { name: "initiator", type: "address" },
      { name: "maxClaimFee", type: "uint256" },
      { name: "maxSwapFee", type: "uint256" },
      { name: "maxTolerance", type: "uint256" },
      { name: "minLiquidityRatio", type: "uint256" },
      { name: "metaData_", type: "bytes" },
    ],
    [
      initiator,
      DEFAULT_MAX_CLAIM_FEE,
      DEFAULT_MAX_SWAP_FEE,
      DEFAULT_MAX_TOLERANCE,
      DEFAULT_MIN_LIQUIDITY_RATIO,
      "0x",
    ],
  );
}

export function encodeYieldClaimerCallbackData(
  initiator: `0x${string}`,
  feeRecipient: `0x${string}`,
): `0x${string}` {
  return encodeAbiParameters(
    [
      { name: "initiator", type: "address" },
      { name: "feeRecipient", type: "address" },
      { name: "maxClaimFee", type: "uint256" },
      { name: "metaData_", type: "bytes" },
    ],
    [initiator, feeRecipient, DEFAULT_MAX_CLAIM_FEE, "0x"],
  );
}

export function encodeMerklOperatorCallbackData(
  initiator: `0x${string}`,
  rewardRecipient: `0x${string}`,
): `0x${string}` {
  return encodeAbiParameters(
    [
      { name: "initiator", type: "address" },
      { name: "rewardRecipient", type: "address" },
      { name: "maxClaimFee", type: "uint256" },
      { name: "metaData_", type: "bytes" },
    ],
    [initiator, rewardRecipient, DEFAULT_MAX_CLAIM_FEE, "0x"],
  );
}

export function encodeCowSwapTokenMetadata(
  strategy: string,
  sellTokens: `0x${string}`[],
  buyToken: `0x${string}`,
): `0x${string}` {
  const innerData = encodeAbiParameters(
    [
      { name: "sellTokens", type: "address[]" },
      { name: "buyToken", type: "address" },
    ],
    [sellTokens, buyToken],
  );
  return encodeOuterMetadata(strategy, innerData);
}

export function encodeCoupledStrategyMetadata(
  strategy: string,
): `0x${string}` {
  return encodeOuterMetadata(strategy, "0x");
}

export function encodeCompounderCoupledCallbackData(
  initiator: `0x${string}`,
  strategy: string,
): `0x${string}` {
  const metaData = encodeCoupledStrategyMetadata(strategy);
  return encodeAbiParameters(
    [
      { name: "initiator", type: "address" },
      { name: "maxClaimFee", type: "uint256" },
      { name: "maxSwapFee", type: "uint256" },
      { name: "maxTolerance", type: "uint256" },
      { name: "minLiquidityRatio", type: "uint256" },
      { name: "metaData_", type: "bytes" },
    ],
    [
      initiator,
      DEFAULT_MAX_CLAIM_FEE,
      DEFAULT_MAX_SWAP_FEE,
      DEFAULT_MAX_TOLERANCE,
      DEFAULT_MIN_LIQUIDITY_RATIO,
      metaData,
    ],
  );
}

export function encodeYieldClaimerCoupledCallbackData(
  initiator: `0x${string}`,
  feeRecipient: `0x${string}`,
  strategy: string,
): `0x${string}` {
  const metaData = encodeCoupledStrategyMetadata(strategy);
  return encodeAbiParameters(
    [
      { name: "initiator", type: "address" },
      { name: "feeRecipient", type: "address" },
      { name: "maxClaimFee", type: "uint256" },
      { name: "metaData_", type: "bytes" },
    ],
    [initiator, feeRecipient, DEFAULT_MAX_CLAIM_FEE, metaData],
  );
}
