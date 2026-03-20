import type {
  Provider,
  IAgentRuntime,
  Memory,
  State,
  ProviderResult,
} from "@elizaos/core";
import { initWallet } from "../shared/wallet";
import { formatUnits } from "viem";
import { erc20Abi } from "../shared/abis";
import { TOKENS } from "../shared/constants";

const KEYWORDS = ["balance", "wallet", "how much", "holdings"];

export const walletBalancesProvider: Provider = {
  name: "ARCADIA_WALLET_BALANCES",
  description:
    "Returns token balances for the connected wallet on Base.",
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
      const publicClient = walletProvider.getPublicClient("base");
      const wallet = walletProvider.getAddress();

      const entries = Object.entries(TOKENS);
      const balances = await Promise.all(
        entries.map(async ([symbol, token]) => {
          const raw = await publicClient.readContract({
            address: token.address,
            abi: erc20Abi,
            functionName: "balanceOf",
            args: [wallet as `0x${string}`],
          });
          return { symbol, balance: formatUnits(raw as bigint, token.decimals) };
        }),
      );

      const lines = balances.map((b) => `  ${b.symbol}: ${b.balance}`);
      return {
        text: `Wallet ${wallet} balances:\n${lines.join("\n")}`,
      };
    } catch (error) {
      return { text: "" };
    }
  },
};
