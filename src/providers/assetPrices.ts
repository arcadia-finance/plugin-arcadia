import type {
  Provider,
  IAgentRuntime,
  Memory,
  State,
  ProviderResult,
} from "@elizaos/core";
import { apiGet } from "../shared/api";
import { TOKENS } from "../shared/constants";

const KEYWORDS = ["price", "worth", "cost", "value of"];

export const assetPricesProvider: Provider = {
  name: "ARCADIA_ASSET_PRICES",
  description: "Returns current prices for major tokens on Base.",
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
      const addresses = Object.values(TOKENS).map((t) => t.address);
      const queryParts = addresses
        .map((a) => `assets=${encodeURIComponent(a)}`)
        .join("&");
      const data = await apiGet<Record<string, number>>(
        `/assets/prices?chain_id=8453&${queryParts}`,
      );

      const entries = Object.entries(data);
      if (entries.length === 0) {
        return { text: "No price data found." };
      }

      const addressToSymbol = new Map(
        Object.entries(TOKENS).map(([sym, t]) => [
          t.address.toLowerCase(),
          sym,
        ]),
      );

      const lines = entries.map(([address, price]) => {
        const sym = addressToSymbol.get(address.toLowerCase()) ?? address;
        return `  ${sym}: $${price}`;
      });

      return {
        text: `Asset prices:\n${lines.join("\n")}`,
        data,
      };
    } catch (error) {
      return { text: "" };
    }
  },
};
