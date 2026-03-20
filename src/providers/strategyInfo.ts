import type {
  Provider,
  IAgentRuntime,
  Memory,
  State,
  ProviderResult,
} from "@elizaos/core";
import { apiGet } from "../shared/api";
import type { StrategyInfo } from "../types";

const KEYWORDS = ["strategy info", "strategy detail", "strategy #"];

export const strategyInfoProvider: Provider = {
  name: "ARCADIA_STRATEGY_INFO",
  description:
    "Returns detailed info for a specific strategy including pool address, tick, and ranges.",
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

    const idMatch = (message?.content?.text ?? "").match(
      /(?:strategy\s*#?\s*)(\d+)/i,
    );
    if (!idMatch) {
      return { text: "" };
    }
    const strategyId = parseInt(idMatch[1], 10);

    try {
      const data = await apiGet<StrategyInfo>(`/strategies/${strategyId}/info`, {
        chain_id: 8453,
      });

      const lines = [
        `Strategy #${strategyId} Info:`,
        `Pool: ${data.pool_address}`,
        `Current Tick: ${data.current_tick_float}`,
      ];

      if (data.ranges) {
        lines.push(`Ranges: ${JSON.stringify(data.ranges)}`);
      }

      return { text: lines.join("\n") };
    } catch (error) {
      return { text: "" };
    }
  },
};
