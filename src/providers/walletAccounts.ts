import type {
  Provider,
  IAgentRuntime,
  Memory,
  State,
  ProviderResult,
} from "@elizaos/core";
import { initWallet } from "../shared/wallet";
import { apiGet } from "../shared/api";
import type { AccountSummary } from "../types";

const KEYWORDS = ["account", "arcadia", "margin", "spot"];

export const walletAccountsProvider: Provider = {
  name: "ARCADIA_WALLET_ACCOUNTS",
  description: "Lists all Arcadia accounts owned by the connected wallet.",
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

      const data = await apiGet<{ accounts: AccountSummary[] }>("/accounts", {
        chain_id: 8453,
        owner: wallet,
      });
      const accounts = data.accounts;

      if (!accounts || accounts.length === 0) {
        return { text: `No Arcadia accounts found for wallet ${wallet}.` };
      }

      const lines = accounts.map(
        (a) => `- ${a.account_address} (v${a.creation_version})`,
      );
      return {
        text: `Found ${accounts.length} Arcadia account(s):\n${lines.join("\n")}`,
      };
    } catch (error) {
      return { text: "" };
    }
  },
};
