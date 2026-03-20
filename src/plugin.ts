import type { Plugin } from "@elizaos/core";
import { actions } from "./actions";
import { providers } from "./providers";

export const arcadiaPlugin: Plugin = {
  name: "arcadia-finance",
  description:
    "Arcadia Finance: manage concentrated liquidity positions on Uniswap and Aerodrome with automated rebalancing, compounding, and yield optimization on Base.",
  actions,
  providers,
  dependencies: ["evm"],
};

export default arcadiaPlugin;
