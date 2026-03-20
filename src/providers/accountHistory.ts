import type {
  Provider,
  IAgentRuntime,
  Memory,
  State,
  ProviderResult,
} from "@elizaos/core";
import { apiGet } from "../shared/api";
import type { HistoricResponse } from "../types";

const KEYWORDS = ["history", "historic", "value over", "chart", "trend"];

function extractAddress(text: string): string | null {
  const match = text.match(/0x[a-fA-F0-9]{40}/);
  return match ? match[0] : null;
}

export const accountHistoryProvider: Provider = {
  name: "ARCADIA_ACCOUNT_HISTORY",
  description:
    "Returns historical account value data for a specific Arcadia account.",
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

    const accountAddress = extractAddress(
      message?.content?.text ?? "",
    );
    if (!accountAddress) {
      return { text: "" };
    }

    try {
      const end = Math.floor(Date.now() / 1000);
      const start = end - 14 * 86400;

      const data = await apiGet<HistoricResponse>(
        "/accounts/historic_account_values",
        {
          chain_id: 8453,
          account_address: accountAddress,
          start,
          end,
        },
      );

      const entries = Object.entries(data.values ?? {}).sort(
        ([a], [b]) => Number(a) - Number(b),
      );

      if (entries.length === 0) {
        return {
          text: `No history found for account ${accountAddress} over the last 14 days.`,
        };
      }

      const lines = entries.slice(-10).map(([ts, val]) => {
        const date = new Date(Number(ts) * 1000).toISOString().slice(0, 10);
        return `  ${date}: $${Number(val).toFixed(2)}`;
      });

      if (data.value_now) {
        lines.push(`  Now: $${Number(data.value_now.usd_value).toFixed(2)}`);
      }

      return {
        text: `Account ${accountAddress} value history (last 14 days):\n${lines.join("\n")}`,
      };
    } catch (error) {
      return { text: "" };
    }
  },
};
