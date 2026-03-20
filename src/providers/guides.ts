import type {
  Provider,
  IAgentRuntime,
  Memory,
  State,
  ProviderResult,
} from "@elizaos/core";

const KEYWORDS = ["guide", "how to", "tutorial", "explain", "help"];

const GUIDES: Record<string, string> = {
  overview: [
    "Arcadia Finance lets you deploy and manage concentrated liquidity positions with optional leverage.",
    "Core workflow: create an account, deposit collateral, open an LP position via a strategy, and optionally borrow to leverage.",
    "Accounts hold your assets on-chain. Margin accounts connect to a lending pool for borrowing. Spot accounts have no debt.",
    "Use getWalletAccounts to list accounts, getAccountInfo for details, and getStrategyList to find strategies.",
  ].join(" "),
  strategies: [
    "Strategies define concentrated liquidity positions on Uniswap V3 or Aerodrome (Slipstream).",
    "Each strategy has a pair (e.g. WETH/USDC), a DEX protocol, a fee tier, and a tick range.",
    "Use getStrategyList to browse available strategies. Use getStrategyInfo with a strategyId for full details.",
    "To open a position: call addLiquidity with your account, strategy ID, deposit token, amount, and leverage.",
    "Leverage 0 means no borrowing. Leverage 2 means 2x exposure funded by the lending pool.",
  ].join(" "),
  automations: [
    "Arcadia offers on-chain automations (asset managers) that run without manual intervention.",
    "Rebalancer: re-centers your LP when it drifts out of range.",
    "Compounder: reinvests earned fees back into the LP position.",
    "Yield Claimer: claims accrued fees and sends them to a wallet.",
    "CowSwap variants: use CowSwap for gas-efficient token swaps during compounding or yield claiming.",
    "Merkl Operator: claims Merkl reward distributions.",
    "Enable automations via setAssetManagers. Encode parameters with the encode* tools first.",
  ].join(" "),
};

export const guidesProvider: Provider = {
  name: "ARCADIA_GUIDES",
  description:
    "Returns educational guides about Arcadia Finance concepts.",
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

    let matchedGuide: string | null = null;
    let matchedTopic: string | null = null;

    if (
      text.includes("automation") ||
      text.includes("rebalance") ||
      text.includes("compound")
    ) {
      matchedGuide = GUIDES.automations;
      matchedTopic = "automations";
    } else if (
      text.includes("strategy") ||
      text.includes("lp") ||
      text.includes("liquidity")
    ) {
      matchedGuide = GUIDES.strategies;
      matchedTopic = "strategies";
    } else {
      matchedGuide = GUIDES.overview;
      matchedTopic = "overview";
    }

    return {
      text: `Guide: ${matchedTopic}\n\n${matchedGuide}`,
    };
  },
};
