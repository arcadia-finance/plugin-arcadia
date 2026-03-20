import type {
  Action,
  ActionResult,
  IAgentRuntime,
  Memory,
  State,
  HandlerCallback,
} from "@elizaos/core";
import { ModelType, parseKeyValueXml, composePromptFromState } from "@elizaos/core";
import { initWallet } from "../shared/wallet";
import { encodeFunctionData, parseUnits } from "viem";
import { withdrawTemplate } from "../templates";
import { accountAbi, erc20Abi } from "../shared/abis";

export const withdrawAction: Action = {
  name: "ARCADIA_WITHDRAW",
  description: "Withdraw tokens from an Arcadia account to your wallet.",
  similes: [
    "withdraw from arcadia",
    "withdraw tokens arcadia",
    "remove collateral arcadia",
    "take out arcadia",
  ],
  examples: [
    [
      {
        name: "user",
        content: { text: "Withdraw 0.5 WETH from my Arcadia account" },
      },
      {
        name: "assistant",
        content: { text: "Withdrawing 0.5 WETH from your Arcadia account." },
      },
    ],
  ],
  validate: async (
    runtime: IAgentRuntime,
    message: Memory,
  ): Promise<boolean> => {
    const text = message?.content?.text?.toLowerCase() ?? "";
    if (!text.includes("withdraw")) return false;
    const pk = runtime.getSetting("EVM_PRIVATE_KEY");
    return typeof pk === "string" && pk.startsWith("0x");
  },
  handler: async (
    runtime: IAgentRuntime,
    message: Memory,
    state: State | undefined,
    _options: unknown,
    callback?: HandlerCallback,
  ): Promise<ActionResult> => {
    try {
      const walletProvider = await initWallet(runtime);
      const walletClient = walletProvider.getWalletClient("base");
      const publicClient = walletProvider.getPublicClient("base");

      if (!state) state = (await runtime.composeState(message)) as State;
      state = await runtime.composeState(message, ["RECENT_MESSAGES"], true);
      const context = composePromptFromState({ state, template: withdrawTemplate });
      const xml = await runtime.useModel(ModelType.TEXT_SMALL, { prompt: context });
      const params = parseKeyValueXml(xml as string) ?? {};

      const accountAddress = params.accountAddress as string;
      const tokenAddress = params.tokenAddress as string;
      const amount = params.amount as string;

      if (!accountAddress || !tokenAddress || !amount) {
        throw new Error("Missing required parameters: accountAddress, tokenAddress, amount");
      }

      const decimals = await publicClient.readContract({
        address: tokenAddress as `0x${string}`,
        abi: erc20Abi,
        functionName: "decimals",
      });
      const amountWei = parseUnits(amount, decimals);
      if (amountWei === 0n) throw new Error("Amount must be greater than 0");

      const data = encodeFunctionData({
        abi: accountAbi,
        functionName: "withdraw",
        args: [[tokenAddress as `0x${string}`], [0n], [amountWei]],
      });

      const hash = await walletClient.sendTransaction({
        to: accountAddress as `0x${string}`,
        data,
        chain: walletClient.chain,
        account: walletClient.account!,
      });

      const msg = `Withdrew ${amount} tokens from ${accountAddress}. Tx: ${hash}`;
      if (callback) callback({ text: msg });
      return { success: true, text: msg, data: { hash } };
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      if (callback) callback({ text: `Error: ${msg}` });
      return { success: false, text: `Error: ${msg}` };
    }
  },
};
