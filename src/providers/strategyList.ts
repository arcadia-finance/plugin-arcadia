import type {
  Provider,
  IAgentRuntime,
  Memory,
  State,
  ProviderResult,
} from "@elizaos/core";
import { apiGet } from "../shared/api";
import type { FeaturedStrategy } from "../types";

const KEYWORDS = [
  "strategy",
  "strategies",
  "featured",
  "lp",
  "liquidity",
  "yield farm",
];

export const strategyListProvider: Provider = {
  name: "ARCADIA_STRATEGY_LIST",
  description: "Lists featured LP strategies with APY and leverage info.",
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
      const strategies = await apiGet<FeaturedStrategy[]>("/featured", {
        chain_id: 8453,
      });

      if (!strategies || strategies.length === 0) {
        return { text: "No featured strategies found." };
      }

      const lines = strategies.map(
        (s) =>
          `- #${s.id}: ${s.display_name} (${s.protocol})\n` +
          `  APY: ${(s.apy * 100).toFixed(2)}% | ${s.is_spot ? "Spot" : `Leverage up to ${s.leverage}x`}`,
      );

      return {
        text: `Featured LP Strategies:\n${lines.join("\n")}`,
      };
    } catch (error) {
      return { text: "" };
    }
  },
};
