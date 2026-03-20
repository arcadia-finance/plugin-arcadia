import type {
  Provider,
  IAgentRuntime,
  Memory,
  State,
  ProviderResult,
} from "@elizaos/core";
import { apiGet } from "../shared/api";

const KEYWORDS = ["recommend", "suggestion", "best strategy", "which strategy"];

function extractAddress(text: string): string | null {
  const match = text.match(/0x[a-fA-F0-9]{40}/);
  return match ? match[0] : null;
}

export const strategyRecommendationProvider: Provider = {
  name: "ARCADIA_STRATEGY_RECOMMENDATION",
  description:
    "Returns strategy recommendations for a specific Arcadia account.",
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
      const data = await apiGet<unknown>("/recommendation", {
        chain_id: 8453,
        account: accountAddress,
      });

      return {
        text: `Recommendation for ${accountAddress}:\n${JSON.stringify(data, null, 2)}`,
      };
    } catch (error) {
      return { text: "" };
    }
  },
};
