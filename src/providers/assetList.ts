import type {
  Provider,
  IAgentRuntime,
  Memory,
  State,
  ProviderResult,
} from "@elizaos/core";
import { apiGet } from "../shared/api";
import type { Asset } from "../types";

const KEYWORDS = ["asset", "supported token", "token list", "which tokens"];

export const assetListProvider: Provider = {
  name: "ARCADIA_ASSET_LIST",
  description: "Lists all assets supported by Arcadia on Base.",
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
      const data = await apiGet<{ assets: Asset[] }>("/assets", {
        chain_id: 8453,
      });
      const assets = data.assets;

      if (!assets || assets.length === 0) {
        return { text: "No supported assets found." };
      }

      const lines = assets
        .slice(0, 30)
        .map((a) => `  ${a.name} (${a.address}, ${a.decimals} decimals)`);
      const suffix =
        assets.length > 30 ? `\n  ... and ${assets.length - 30} more` : "";

      return {
        text: `Supported assets (${assets.length} total):\n${lines.join("\n")}${suffix}`,
      };
    } catch (error) {
      return { text: "" };
    }
  },
};
