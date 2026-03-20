import type {
  Provider,
  IAgentRuntime,
  Memory,
  State,
  ProviderResult,
} from "@elizaos/core";
import { apiGet } from "../shared/api";

const KEYWORDS = ["pnl", "profit", "loss", "yield", "earnings", "performance"];

function extractAddress(text: string): string | null {
  const match = text.match(/0x[a-fA-F0-9]{40}/);
  return match ? match[0] : null;
}

export const accountPnlProvider: Provider = {
  name: "ARCADIA_ACCOUNT_PNL",
  description:
    "Returns PnL and yield data for a specific Arcadia account.",
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
      const params = { chain_id: 8453, account_address: accountAddress };

      const [pnl, yieldData] = await Promise.all([
        apiGet<unknown>("/accounts/pnl_cost_basis", params),
        apiGet<unknown>("/accounts/yield_earned", params),
      ]);

      const lines: string[] = [`Account: ${accountAddress}`];
      if (pnl) lines.push(`PnL: ${JSON.stringify(pnl)}`);
      if (yieldData) lines.push(`Yield: ${JSON.stringify(yieldData)}`);

      return { text: lines.join("\n"), data: { pnl: pnl as Record<string, unknown>, yieldData: yieldData as Record<string, unknown> } };
    } catch (error) {
      return { text: "" };
    }
  },
};
