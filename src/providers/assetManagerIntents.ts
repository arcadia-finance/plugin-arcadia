import type {
  Provider,
  IAgentRuntime,
  Memory,
  State,
  ProviderResult,
} from "@elizaos/core";

const KEYWORDS = [
  "automation",
  "asset manager",
  "rebalancer",
  "compounder",
  "yield claimer",
  "cow swap",
  "merkl",
];

const AUTOMATIONS = [
  {
    name: "rebalancer",
    description:
      "Automatically rebalances LP positions when they go out of range.",
  },
  {
    name: "compounder",
    description: "Compounds earned fees back into the LP position.",
  },
  {
    name: "compounder_staked",
    description:
      "Compounds fees for staked LP positions using CowSwap.",
  },
  {
    name: "yield_claimer",
    description:
      "Claims accrued yield and sends it to a fee recipient.",
  },
  {
    name: "yield_claimer_cowswap",
    description:
      "Claims yield and swaps it to a target token via CowSwap.",
  },
  {
    name: "cow_swapper",
    description:
      "Standalone CowSwap integration for gasless token swaps.",
  },
  {
    name: "merkl_operator",
    description:
      "Claims Merkl rewards and sends them to a reward recipient.",
  },
];

export const assetManagerIntentsProvider: Provider = {
  name: "ARCADIA_ASSET_MANAGER_INTENTS",
  description:
    "Lists available Arcadia automation types and their descriptions.",
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

    const lines = AUTOMATIONS.map((a) => `- ${a.name}: ${a.description}`);
    return {
      text: `Available Arcadia Automations:\n${lines.join("\n")}`,
    };
  },
};
