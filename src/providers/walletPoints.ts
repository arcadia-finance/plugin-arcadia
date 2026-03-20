import type {
  Provider,
  IAgentRuntime,
  Memory,
  State,
  ProviderResult,
} from "@elizaos/core";
import { initWallet } from "../shared/wallet";
import { apiGet } from "../shared/api";
import type { PointsData } from "../types";

const KEYWORDS = ["points", "my points", "arcadia points"];

export const walletPointsProvider: Provider = {
  name: "ARCADIA_WALLET_POINTS",
  description: "Returns Arcadia points for the connected wallet.",
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
      const walletProvider = await initWallet(runtime);
      const wallet = walletProvider.getAddress();

      const data = await apiGet<PointsData>("/points", {
        wallet_address: wallet,
      });

      return {
        text: `Wallet: ${wallet}\nPoints: ${data.points}`,
      };
    } catch (error) {
      return { text: "" };
    }
  },
};
