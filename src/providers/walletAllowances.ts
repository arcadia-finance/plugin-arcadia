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

const KEYWORDS = ["allowance", "approved", "approval"];

function extractAddress(text: string): string | null {
  const match = text.match(/0x[a-fA-F0-9]{40}/);
  return match ? match[0] : null;
}

export const walletAllowancesProvider: Provider = {
  name: "ARCADIA_WALLET_ALLOWANCES",
  description:
    "Returns token allowances for the connected wallet to a specific spender on Base.",
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

    const spender = extractAddress(message?.content?.text ?? "");
    if (!spender) {
      return { text: "" };
    }

    try {
      const walletProvider = await initWallet(runtime);
      const publicClient = walletProvider.getPublicClient("base");
      const wallet = walletProvider.getAddress();

      const entries = Object.entries(TOKENS);
      const allowances = await Promise.all(
        entries.map(async ([symbol, token]) => {
          const raw = await publicClient.readContract({
            address: token.address,
            abi: erc20Abi,
            functionName: "allowance",
            args: [wallet as `0x${string}`, spender as `0x${string}`],
          });
          return {
            symbol,
            allowance: formatUnits(raw as bigint, token.decimals),
          };
        }),
      );

      const lines = allowances.map((a) => `  ${a.symbol}: ${a.allowance}`);
      return {
        text: `Wallet ${wallet} allowances for ${spender}:\n${lines.join("\n")}`,
      };
    } catch (error) {
      return { text: "" };
    }
  },
};
