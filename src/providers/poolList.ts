import type {
  Provider,
  IAgentRuntime,
  Memory,
  State,
  ProviderResult,
} from "@elizaos/core";
import { apiGet } from "../shared/api";
import type { Pool } from "../types";

const KEYWORDS = ["pool", "lending", "lend", "supply", "borrow rate", "apy"];

export const poolListProvider: Provider = {
  name: "ARCADIA_POOL_LIST",
  description: "Lists all Arcadia lending pools with APY and utilization.",
  dynamic: true,
  get: async (
    runtime: IAgentRuntime,
    message: Memory,
    _state?: State,
  ): Promise<ProviderResult> => {
    const text = message?.content?.text?.toLowerCase() ?? "";
    if (!KEYWORDS.some((k) => text.includes(k))) {
      return { text: "" };
    }

    try {
      const pools = await apiGet<Pool[]>("/pools", { chain_id: 8453 });

      if (!pools || pools.length === 0) {
        return { text: "No lending pools found." };
      }

      const lines = pools.map(
        (p) =>
          `- ${p.name} Pool (${p.address})\n` +
          `  APY: ${(p.apy * 100).toFixed(2)}% | Util: ${(p.utilisation * 100).toFixed(1)}% | TVL: $${(p.total_realised_liquidity_usd / 1e6).toFixed(2)}M`,
      );

      return {
        text: `Arcadia Lending Pools:\n${lines.join("\n")}`,
      };
    } catch (error) {
      return { text: "" };
    }
  },
};
