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
import { borrowTemplate } from "../templates";
import { poolAbi, erc20Abi } from "../shared/abis";

export const borrowAction: Action = {
  name: "ARCADIA_BORROW",
  description: "Borrow tokens from an Arcadia lending pool against an account.",
  similes: [
    "borrow from arcadia",
    "borrow tokens arcadia",
    "take loan arcadia",
    "leverage arcadia",
  ],
  examples: [
    [
      {
        name: "user",
        content: {
          text: "Borrow 500 USDC from the USDC pool against my account",
        },
      },
      {
        name: "assistant",
        content: { text: "Borrowing 500 USDC from the lending pool." },
      },
    ],
  ],
  validate: async (
    runtime: IAgentRuntime,
    message: Memory,
  ): Promise<boolean> => {
    const text = message?.content?.text?.toLowerCase() ?? "";
    if (!text.includes("borrow")) return false;
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
      const wallet = walletProvider.getAddress();

      if (!state) state = (await runtime.composeState(message)) as State;
      state = await runtime.composeState(message, ["RECENT_MESSAGES"], true);
      const context = composePromptFromState({ state, template: borrowTemplate });
      const xml = await runtime.useModel(ModelType.TEXT_SMALL, { prompt: context });
      const params = parseKeyValueXml(xml as string) ?? {};

      const accountAddress = params.accountAddress as string;
      const poolAddress = params.poolAddress as string;
      const amount = params.amount as string;

      if (!accountAddress || !poolAddress || !amount) {
        throw new Error("Missing required parameters: accountAddress, poolAddress, amount");
      }

      const decimals = await publicClient.readContract({
        address: poolAddress as `0x${string}`,
        abi: erc20Abi,
        functionName: "decimals",
      });
      const amountWei = parseUnits(amount, decimals);
      if (amountWei === 0n) throw new Error("Amount must be greater than 0");

      const data = encodeFunctionData({
        abi: poolAbi,
        functionName: "borrow",
        args: [
          amountWei,
          accountAddress as `0x${string}`,
          wallet as `0x${string}`,
          "0x000000" as `0x${string}`,
        ],
      });

      const hash = await walletClient.sendTransaction({
        to: poolAddress as `0x${string}`,
        data,
        chain: walletClient.chain,
        account: walletClient.account!,
      });

      const msg = `Borrowed ${amount} from ${poolAddress}. Tx: ${hash}`;
      if (callback) callback({ text: msg });
      return { success: true, text: msg, data: { hash } };
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      if (callback) callback({ text: `Error: ${msg}` });
      return { success: false, text: `Error: ${msg}` };
    }
  },
};
