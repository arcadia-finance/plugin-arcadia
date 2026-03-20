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
import { repayTemplate } from "../templates";
import { poolAbi, erc20Abi } from "../shared/abis";

export const repayAction: Action = {
  name: "ARCADIA_REPAY",
  description: "Repay borrowed tokens to an Arcadia lending pool.",
  similes: [
    "repay arcadia",
    "repay loan arcadia",
    "pay back arcadia",
    "reduce debt arcadia",
  ],
  examples: [
    [
      {
        name: "user",
        content: { text: "Repay 500 USDC to the lending pool" },
      },
      {
        name: "assistant",
        content: { text: "Repaying 500 USDC to the lending pool." },
      },
    ],
  ],
  validate: async (
    runtime: IAgentRuntime,
    message: Memory,
  ): Promise<boolean> => {
    const text = message?.content?.text?.toLowerCase() ?? "";
    if (!text.includes("repay") && !text.includes("pay back")) return false;
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
      const context = composePromptFromState({ state, template: repayTemplate });
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

      // Check allowance and approve if needed
      const currentAllowance = (await publicClient.readContract({
        address: poolAddress as `0x${string}`,
        abi: erc20Abi,
        functionName: "allowance",
        args: [wallet as `0x${string}`, poolAddress as `0x${string}`],
      })) as bigint;

      if (currentAllowance < amountWei) {
        const approveData = encodeFunctionData({
          abi: erc20Abi,
          functionName: "approve",
          args: [poolAddress as `0x${string}`, amountWei],
        });
        await walletClient.sendTransaction({
          to: poolAddress as `0x${string}`,
          data: approveData,
          chain: walletClient.chain,
          account: walletClient.account!,
        });
      }

      const data = encodeFunctionData({
        abi: poolAbi,
        functionName: "repay",
        args: [amountWei, accountAddress as `0x${string}`],
      });

      const hash = await walletClient.sendTransaction({
        to: poolAddress as `0x${string}`,
        data,
        chain: walletClient.chain,
        account: walletClient.account!,
      });

      const msg = `Repaid ${amount} to ${poolAddress} for account ${accountAddress}. Tx: ${hash}`;
      if (callback) callback({ text: msg });
      return { success: true, text: msg, data: { hash } };
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      if (callback) callback({ text: `Error: ${msg}` });
      return { success: false, text: `Error: ${msg}` };
    }
  },
};
