import type {
  Provider,
  IAgentRuntime,
  Memory,
  State,
  ProviderResult,
} from "@elizaos/core";
import { apiGet } from "../shared/api";
import type { AccountOverview } from "../types";

const KEYWORDS = [
  "account",
  "health",
  "collateral",
  "debt",
  "position",
  "info",
];

function extractAddress(text: string): string | null {
  const match = text.match(/0x[a-fA-F0-9]{40}/);
  return match ? match[0] : null;
}

export const accountInfoProvider: Provider = {
  name: "ARCADIA_ACCOUNT_INFO",
  description:
    "Returns detailed info for a specific Arcadia account including health factor, collateral, debt, and assets.",
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
      const data = await apiGet<AccountOverview>("/accounts/overview", {
        chain_id: 8453,
        account: accountAddress,
      });

      const hf =
        data.health_factor != null
          ? (data.health_factor * 100).toFixed(1) + "%"
          : "N/A";
      const isSpot =
        !data.creditor ||
        data.creditor === "0x0000000000000000000000000000000000000000";
      const accountType = isSpot ? "Spot" : "Margin";

      const assetLines =
        data.assets && data.assets.length > 0
          ? data.assets
              .map((a) => `  - ${a.symbol || a.address}: ${a.amount}`)
              .join("\n")
          : "  (none)";

      const result =
        `Account: ${accountAddress}\n` +
        `Type: ${accountType}\n` +
        `Health Factor: ${hf}\n` +
        `Collateral: ${data.collateral_value || "0"}\n` +
        `Debt: ${data.debt_value || "0"}\n` +
        `Assets:\n${assetLines}`;

      return { text: result };
    } catch (error) {
      return { text: "" };
    }
  },
};
