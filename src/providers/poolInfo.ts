import type {
  Provider,
  IAgentRuntime,
  Memory,
  State,
  ProviderResult,
} from "@elizaos/core";
import { apiGet } from "../shared/api";

const KEYWORDS = ["pool detail", "pool info", "pool data"];

function extractAddress(text: string): string | null {
  const match = text.match(/0x[a-fA-F0-9]{40}/);
  return match ? match[0] : null;
}

export const poolInfoProvider: Provider = {
  name: "ARCADIA_POOL_INFO",
  description: "Returns detailed data for a specific Arcadia lending pool.",
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

    const poolAddress = extractAddress(message?.content?.text ?? "");
    if (!poolAddress) {
      return { text: "" };
    }

    try {
      const data = await apiGet<unknown>("/pools_data", {
        chain_id: 8453,
        pool_address: poolAddress,
      });

      return {
        text: `Pool data for ${poolAddress}:\n${JSON.stringify(data, null, 2)}`,
      };
    } catch (error) {
      return { text: "" };
    }
  },
};
