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
import { encodeFunctionData, maxUint256, parseUnits } from "viem";
import { approveTemplate } from "../templates";
import { erc20Abi } from "../shared/abis";

export const approveAction: Action = {
  name: "ARCADIA_APPROVE",
  description: "Approve a token for spending by an Arcadia account or pool.",
  similes: [
    "approve token arcadia",
    "approve usdc arcadia",
    "approve weth arcadia",
    "set allowance arcadia",
  ],
  examples: [
    [
      {
        name: "user",
        content: { text: "Approve USDC for my Arcadia account" },
      },
      {
        name: "assistant",
        content: { text: "Approving USDC for your Arcadia account." },
      },
    ],
  ],
  validate: async (
    runtime: IAgentRuntime,
    message: Memory,
  ): Promise<boolean> => {
    const text = message?.content?.text?.toLowerCase() ?? "";
    if (!text.includes("approve")) return false;
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
      const context = composePromptFromState({ state, template: approveTemplate });
      const xml = await runtime.useModel(ModelType.TEXT_SMALL, { prompt: context });
      const params = parseKeyValueXml(xml as string) ?? {};

      const tokenAddress = params.tokenAddress as string;
      const spender = params.spender as string;
      const amount = params.amount as string;

      if (!tokenAddress || !spender || !amount) {
        throw new Error("Missing required parameters: tokenAddress, spender, amount");
      }

      let amountWei: bigint;
      if (amount === "max") {
        amountWei = maxUint256;
      } else {
        const decimals = await publicClient.readContract({
          address: tokenAddress as `0x${string}`,
          abi: erc20Abi,
          functionName: "decimals",
        });
        amountWei = parseUnits(amount, decimals);
      }

      const data = encodeFunctionData({
        abi: erc20Abi,
        functionName: "approve",
        args: [spender as `0x${string}`, amountWei],
      });

      const hash = await walletClient.sendTransaction({
        to: tokenAddress as `0x${string}`,
        data,
        chain: walletClient.chain,
        account: walletClient.account!,
      });

      const msg = `Approved ${amount} of ${tokenAddress} for ${spender}. Tx: ${hash}`;
      if (callback) callback({ text: msg });
      return { success: true, text: msg, data: { hash } };
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      if (callback) callback({ text: `Error: ${msg}` });
      return { success: false, text: `Error: ${msg}` };
    }
  },
};
